package com.example.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.DTOs.AssinaturaDTO;
import com.example.demo.DTOs.ContratoDTO;
import com.example.demo.DTOs.ContratoRequestDTO;
import com.example.demo.DTOs.DashboardDTO;
import com.example.demo.DTOs.ImovelFiltroDTO;
import com.example.demo.DTOs.ItemGraficoDTO;
import com.example.demo.DTOs.OfertaDTO;
import com.example.demo.DTOs.OfertaRequestDTO;
import com.example.demo.DTOs.PaginaDTO;
import com.example.demo.DTOs.PerfilUpdateDTO;
import com.example.demo.DTOs.UserDTO;
import com.example.demo.exceptions.NegocioException;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.UserRepository;

// Testa as regras de negócio da Aula 3 direto nos serviços (banco H2 do perfil "test").
// Cada teste roda em uma transação desfeita no final, então um não interfere no outro.
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RegrasDeNegocioTests {

    private static final String CONDICOES = "Pagamento à vista na assinatura da escritura, imóvel entregue livre de ônus.";

    @Autowired private OfertaService ofertaService;
    @Autowired private ContratoService contratoService;
    @Autowired private FavoritoService favoritoService;
    @Autowired private ImovelService imovelService;
    @Autowired private DashboardService dashboardService;
    @Autowired private PerfilService perfilService;
    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;
    @Autowired private ImovelRepository imovelRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private UserModel cliente;
    private UserModel outroCliente;
    private UserModel corretor;
    private UserModel outroCorretor;
    private UserModel admin;
    private ImovelModel imovel;

    @BeforeEach
    void preparar() {
        cliente = usuario("Maria da Silva", "maria.teste@email.com", "USER");
        outroCliente = usuario("João Souza", "joao.teste@email.com", "USER");
        corretor = usuario("Carlos Corretor", "carlos.teste@email.com", "CORRETOR");
        outroCorretor = usuario("Paula Corretora", "paula.teste@email.com", "CORRETOR");
        admin = usuario("Ana Admin", "ana.teste@email.com", "ADMIN");
        imovel = imovel("Casa de teste do fluxo", "VENDA", "500000", null);
    }

    // ---------- checkpoint: oferta -> aceite -> contrato -> aprovação -> assinatura ----------

    @Test
    void fluxoCompletoDaOfertaAteAAssinatura() {
        OfertaDTO oferta = ofertaService.criar(cliente.getEmail(), new OfertaRequestDTO(imovel.getId(), new BigDecimal("480000"), "Pago à vista"));
        assertEquals("PENDENTE", oferta.status());

        OfertaDTO aceita = ofertaService.aceitar(corretor.getEmail(), oferta.id());
        assertEquals("ACEITA", aceita.status());
        assertEquals("Carlos Corretor", aceita.corretorNome());
        assertEquals("EM_NEGOCIACAO", imovelRepository.findById(imovel.getId()).orElseThrow().getStatus());

        ContratoDTO contrato = contratoService.preparar(corretor.getEmail(),
                new ContratoRequestDTO(oferta.id(), null, "À vista", CONDICOES));
        assertEquals("AGUARDANDO_APROVACAO", contrato.status());
        assertEquals(0, new BigDecimal("480000").compareTo(contrato.valor()), "sem valor informado, usa o valor da oferta");

        ContratoDTO aprovado = contratoService.aprovar(admin.getEmail(), contrato.id());
        assertEquals("APROVADO", aprovado.status());
        assertEquals("Ana Admin", aprovado.avaliadoPorNome());

        ContratoDTO assinado = contratoService.assinar(cliente.getEmail(), contrato.id(), new AssinaturaDTO("Maria da Silva", true));
        assertEquals("ASSINADO", assinado.status());
        assertNotNull(assinado.assinadoEm());
        assertEquals(64, assinado.assinaturaCodigo().length());
        assertEquals("VENDIDO", imovelRepository.findById(imovel.getId()).orElseThrow().getStatus());
    }

    @Test
    void contratoDeAluguelAssinadoDeixaImovelAlugado() {
        ImovelModel aluguel = imovel("Apartamento de teste para alugar", "ALUGUEL", null, "1800");
        ContratoDTO contrato = contratoAprovado(aluguel);
        contratoService.assinar(cliente.getEmail(), contrato.id(), new AssinaturaDTO("Maria da Silva", true));
        assertEquals("ALUGADO", imovelRepository.findById(aluguel.getId()).orElseThrow().getStatus());
    }

    // ---------- ofertas ----------

    @Test
    void ofertaComValorZeroOuSemValorEInvalida() {
        assertStatus(HttpStatus.BAD_REQUEST, () -> ofertaService.criar(cliente.getEmail(), new OfertaRequestDTO(imovel.getId(), BigDecimal.ZERO, null)));
        assertStatus(HttpStatus.BAD_REQUEST, () -> ofertaService.criar(cliente.getEmail(), new OfertaRequestDTO(imovel.getId(), null, null)));
        assertStatus(HttpStatus.BAD_REQUEST, () -> ofertaService.criar(cliente.getEmail(), new OfertaRequestDTO(imovel.getId(), new BigDecimal("-10"), null)));
    }

    @Test
    void ofertaParaImovelInexistenteRetorna404() {
        assertStatus(HttpStatus.NOT_FOUND, () -> ofertaService.criar(cliente.getEmail(), new OfertaRequestDTO(999999, new BigDecimal("1000"), null)));
    }

    @Test
    void apenasClientePodeEnviarOferta() {
        assertStatus(HttpStatus.FORBIDDEN, () -> ofertaService.criar(corretor.getEmail(), new OfertaRequestDTO(imovel.getId(), new BigDecimal("1000"), null)));
    }

    @Test
    void clienteNaoPodeTerDuasOfertasPendentesParaOMesmoImovel() {
        ofertaService.criar(cliente.getEmail(), new OfertaRequestDTO(imovel.getId(), new BigDecimal("400000"), null));
        assertStatus(HttpStatus.CONFLICT, () -> ofertaService.criar(cliente.getEmail(), new OfertaRequestDTO(imovel.getId(), new BigDecimal("410000"), null)));
    }

    @Test
    void depoisDeCanceladaClientePodeEnviarNovaOferta() {
        OfertaDTO primeira = ofertaService.criar(cliente.getEmail(), new OfertaRequestDTO(imovel.getId(), new BigDecimal("400000"), null));
        assertEquals("CANCELADA", ofertaService.cancelar(cliente.getEmail(), primeira.id()).status());
        assertEquals("PENDENTE", ofertaService.criar(cliente.getEmail(), new OfertaRequestDTO(imovel.getId(), new BigDecimal("410000"), null)).status());
    }

    @Test
    void clienteSoCancelaAsPropriasOfertasPendentes() {
        OfertaDTO oferta = ofertaService.criar(cliente.getEmail(), new OfertaRequestDTO(imovel.getId(), new BigDecimal("400000"), null));
        assertStatus(HttpStatus.FORBIDDEN, () -> ofertaService.cancelar(outroCliente.getEmail(), oferta.id()));
        ofertaService.aceitar(corretor.getEmail(), oferta.id());
        assertStatus(HttpStatus.CONFLICT, () -> ofertaService.cancelar(cliente.getEmail(), oferta.id()));
    }

    @Test
    void aceitarUmaOfertaRecusaAsOutrasPendentesEBloqueiaNovas() {
        OfertaDTO daMaria = ofertaService.criar(cliente.getEmail(), new OfertaRequestDTO(imovel.getId(), new BigDecimal("450000"), null));
        OfertaDTO doJoao = ofertaService.criar(outroCliente.getEmail(), new OfertaRequestDTO(imovel.getId(), new BigDecimal("430000"), null));

        ofertaService.aceitar(corretor.getEmail(), daMaria.id());

        OfertaDTO joaoDepois = ofertaService.listarDoCliente(outroCliente.getEmail()).get(0);
        assertEquals(doJoao.id(), joaoDepois.id());
        assertEquals("RECUSADA", joaoDepois.status());
        assertEquals("Outra oferta foi aceita para este imóvel.", joaoDepois.resposta());
        assertStatus(HttpStatus.CONFLICT, () -> ofertaService.criar(outroCliente.getEmail(), new OfertaRequestDTO(imovel.getId(), new BigDecimal("500000"), null)));
    }

    @Test
    void ofertaJaRespondidaNaoPodeSerAceitaNemRecusadaDeNovo() {
        OfertaDTO oferta = ofertaService.criar(cliente.getEmail(), new OfertaRequestDTO(imovel.getId(), new BigDecimal("400000"), null));
        OfertaDTO recusada = ofertaService.recusar(corretor.getEmail(), oferta.id(), "Valor abaixo do mínimo");
        assertEquals("Valor abaixo do mínimo", recusada.resposta());
        assertStatus(HttpStatus.CONFLICT, () -> ofertaService.aceitar(corretor.getEmail(), oferta.id()));
        assertStatus(HttpStatus.CONFLICT, () -> ofertaService.recusar(outroCorretor.getEmail(), oferta.id(), null));
    }

    @Test
    void apenasCorretorAceitaOferta() {
        OfertaDTO oferta = ofertaService.criar(cliente.getEmail(), new OfertaRequestDTO(imovel.getId(), new BigDecimal("400000"), null));
        assertStatus(HttpStatus.FORBIDDEN, () -> ofertaService.aceitar(admin.getEmail(), oferta.id()));
        assertStatus(HttpStatus.FORBIDDEN, () -> ofertaService.aceitar(cliente.getEmail(), oferta.id()));
    }

    // ---------- contratos ----------

    @Test
    void contratoSoPodeSerPreparadoParaOfertaAceita() {
        OfertaDTO oferta = ofertaService.criar(cliente.getEmail(), new OfertaRequestDTO(imovel.getId(), new BigDecimal("400000"), null));
        assertStatus(HttpStatus.CONFLICT, () -> contratoService.preparar(corretor.getEmail(), new ContratoRequestDTO(oferta.id(), null, "À vista", CONDICOES)));
    }

    @Test
    void apenasOCorretorQueAceitouPreparaOContrato() {
        OfertaDTO oferta = ofertaAceita(imovel);
        assertStatus(HttpStatus.FORBIDDEN, () -> contratoService.preparar(outroCorretor.getEmail(), new ContratoRequestDTO(oferta.id(), null, "À vista", CONDICOES)));
    }

    @Test
    void naoPermiteDoisContratosParaAMesmaOferta() {
        OfertaDTO oferta = ofertaAceita(imovel);
        contratoService.preparar(corretor.getEmail(), new ContratoRequestDTO(oferta.id(), null, "À vista", CONDICOES));
        assertStatus(HttpStatus.CONFLICT, () -> contratoService.preparar(corretor.getEmail(), new ContratoRequestDTO(oferta.id(), null, "À vista", CONDICOES)));
    }

    @Test
    void contratoExigeDadosValidos() {
        OfertaDTO oferta = ofertaAceita(imovel);
        assertStatus(HttpStatus.BAD_REQUEST, () -> contratoService.preparar(corretor.getEmail(), new ContratoRequestDTO(oferta.id(), null, "À vista", "curto demais")));
        assertStatus(HttpStatus.BAD_REQUEST, () -> contratoService.preparar(corretor.getEmail(), new ContratoRequestDTO(oferta.id(), null, " ", CONDICOES)));
        assertStatus(HttpStatus.BAD_REQUEST, () -> contratoService.preparar(corretor.getEmail(), new ContratoRequestDTO(oferta.id(), new BigDecimal("0"), "À vista", CONDICOES)));
    }

    @Test
    void reprovarExigeMotivoECorretorPodeRevisarEReenviar() {
        ContratoDTO contrato = contratoService.preparar(corretor.getEmail(),
                new ContratoRequestDTO(ofertaAceita(imovel).id(), null, "À vista", CONDICOES));

        assertStatus(HttpStatus.BAD_REQUEST, () -> contratoService.reprovar(admin.getEmail(), contrato.id(), "  "));

        ContratoDTO reprovado = contratoService.reprovar(admin.getEmail(), contrato.id(), "Faltou a data de entrega das chaves");
        assertEquals("REPROVADO", reprovado.status());
        assertEquals("Faltou a data de entrega das chaves", reprovado.motivoReprovacao());

        // cliente não assina contrato reprovado
        assertStatus(HttpStatus.CONFLICT, () -> contratoService.assinar(cliente.getEmail(), contrato.id(), new AssinaturaDTO("Maria da Silva", true)));
        // outro corretor não revisa
        assertStatus(HttpStatus.FORBIDDEN, () -> contratoService.revisar(outroCorretor.getEmail(), contrato.id(),
                new ContratoRequestDTO(null, null, "À vista", CONDICOES)));

        ContratoDTO revisado = contratoService.revisar(corretor.getEmail(), contrato.id(),
                new ContratoRequestDTO(null, new BigDecimal("470000"), "À vista", CONDICOES + " Chaves entregues em 30 dias."));
        assertEquals("AGUARDANDO_APROVACAO", revisado.status());
        assertNull(revisado.motivoReprovacao());
        assertNull(revisado.avaliadoPorNome(), "a avaliação anterior é descartada ao reenviar");
        assertEquals(0, new BigDecimal("470000").compareTo(revisado.valor()));
    }

    @Test
    void contratoSoPodeSerAprovadoUmaVez() {
        ContratoDTO contrato = contratoAprovado(imovel);
        assertStatus(HttpStatus.CONFLICT, () -> contratoService.aprovar(admin.getEmail(), contrato.id()));
        assertStatus(HttpStatus.CONFLICT, () -> contratoService.revisar(corretor.getEmail(), contrato.id(),
                new ContratoRequestDTO(null, null, "À vista", CONDICOES)));
    }

    @Test
    void apenasAdminAprovaContrato() {
        ContratoDTO contrato = contratoService.preparar(corretor.getEmail(),
                new ContratoRequestDTO(ofertaAceita(imovel).id(), null, "À vista", CONDICOES));
        assertStatus(HttpStatus.FORBIDDEN, () -> contratoService.aprovar(corretor.getEmail(), contrato.id()));
    }

    @Test
    void clienteNaoAssinaAntesDaAprovacao() {
        ContratoDTO contrato = contratoService.preparar(corretor.getEmail(),
                new ContratoRequestDTO(ofertaAceita(imovel).id(), null, "À vista", CONDICOES));
        assertStatus(HttpStatus.CONFLICT, () -> contratoService.assinar(cliente.getEmail(), contrato.id(), new AssinaturaDTO("Maria da Silva", true)));
    }

    @Test
    void assinaturaExigeOProprioClienteAceiteENomeCadastrado() {
        ContratoDTO contrato = contratoAprovado(imovel);
        assertStatus(HttpStatus.FORBIDDEN, () -> contratoService.assinar(outroCliente.getEmail(), contrato.id(), new AssinaturaDTO("João Souza", true)));
        assertStatus(HttpStatus.BAD_REQUEST, () -> contratoService.assinar(cliente.getEmail(), contrato.id(), new AssinaturaDTO("Maria da Silva", false)));
        assertStatus(HttpStatus.BAD_REQUEST, () -> contratoService.assinar(cliente.getEmail(), contrato.id(), new AssinaturaDTO("Outra Pessoa", true)));

        // maiúsculas, acentos e espaços extras não importam
        ContratoDTO assinado = contratoService.assinar(cliente.getEmail(), contrato.id(), new AssinaturaDTO("  MARIA   DA  SILVA ", true));
        assertEquals("ASSINADO", assinado.status());
        assertStatus(HttpStatus.CONFLICT, () -> contratoService.assinar(cliente.getEmail(), contrato.id(), new AssinaturaDTO("Maria da Silva", true)));
    }

    @Test
    void cadaPerfilListaApenasOsContratosQueLheDizemRespeito() {
        ContratoDTO contrato = contratoAprovado(imovel);
        assertTrue(contratoService.listar(cliente.getEmail()).stream().anyMatch(c -> c.id().equals(contrato.id())));
        assertTrue(contratoService.listar(corretor.getEmail()).stream().anyMatch(c -> c.id().equals(contrato.id())));
        assertTrue(contratoService.listar(admin.getEmail()).stream().anyMatch(c -> c.id().equals(contrato.id())));
        assertFalse(contratoService.listar(outroCliente.getEmail()).stream().anyMatch(c -> c.id().equals(contrato.id())));
        assertFalse(contratoService.listar(outroCorretor.getEmail()).stream().anyMatch(c -> c.id().equals(contrato.id())));
        assertStatus(HttpStatus.FORBIDDEN, () -> contratoService.buscar(outroCliente.getEmail(), contrato.id()));
    }

    // ---------- favoritos ----------

    @Test
    void favoritarEIdempotenteERemoverFunciona() {
        assertTrue(favoritoService.adicionar(cliente.getEmail(), imovel.getId()));
        assertFalse(favoritoService.adicionar(cliente.getEmail(), imovel.getId()), "segunda vez não cria outro registro");
        assertEquals(List.of(imovel.getId()), favoritoService.listarIds(cliente.getEmail()));

        favoritoService.remover(cliente.getEmail(), imovel.getId());
        assertTrue(favoritoService.listarIds(cliente.getEmail()).isEmpty());
        assertStatus(HttpStatus.NOT_FOUND, () -> favoritoService.adicionar(cliente.getEmail(), 999999));
    }

    // ---------- busca com filtros e paginação ----------

    @Test
    void buscaFiltraPorFinalidadeEPagina() {
        imovel("Aluguel de teste 1", "ALUGUEL", null, "1000");
        imovel("Aluguel de teste 2", "ALUGUEL", null, "2000");
        imovel("Aluguel de teste 3", "ALUGUEL", null, "3000");

        ImovelFiltroDTO filtro = new ImovelFiltroDTO(null, "ALUGUEL", null, null, null, null, null, null);
        PaginaDTO<ImovelModel> primeira = imovelService.buscar(filtro, 0, 2, "menor-preco");

        assertEquals(2, primeira.content().size());
        assertTrue(primeira.totalElements() >= 3);
        assertEquals((int) Math.ceil(primeira.totalElements() / 2.0), primeira.totalPages());
        assertTrue(primeira.content().stream().allMatch(i -> "ALUGUEL".equals(i.getFinalidade())));
        assertTrue(primeira.content().get(0).getPrecoAluguel().compareTo(primeira.content().get(1).getPrecoAluguel()) <= 0,
                "menor preço primeiro");
    }

    @Test
    void buscaFiltraPorFaixaDePrecoETexto() {
        ImovelFiltroDTO filtro = new ImovelFiltroDTO("fluxo", "VENDA", null, null,
                new BigDecimal("400000"), new BigDecimal("600000"), null, null);
        PaginaDTO<ImovelModel> resultado = imovelService.buscar(filtro, 0, 10, "destaque");
        assertEquals(1, resultado.totalElements());
        assertEquals(imovel.getId(), resultado.content().get(0).getId());
    }

    @Test
    void buscaFiltraDisponiveis() {
        ofertaAceita(imovel); // imóvel vai para EM_NEGOCIACAO
        ImovelFiltroDTO disponiveis = new ImovelFiltroDTO("fluxo", null, null, null, null, null, null, "DISPONIVEL");
        assertEquals(0, imovelService.buscar(disponiveis, 0, 10, null).totalElements());
        ImovelFiltroDTO emNegociacao = new ImovelFiltroDTO("fluxo", null, null, null, null, null, null, "EM_NEGOCIACAO");
        assertEquals(1, imovelService.buscar(emNegociacao, 0, 10, null).totalElements());
    }

    @Test
    void buscaRejeitaParametrosInvalidos() {
        ImovelFiltroDTO precoInvertido = new ImovelFiltroDTO(null, null, null, null, new BigDecimal("10"), new BigDecimal("5"), null, null);
        ImovelFiltroDTO vazio = new ImovelFiltroDTO(null, null, null, null, null, null, null, null);
        assertStatus(HttpStatus.BAD_REQUEST, () -> imovelService.buscar(precoInvertido, 0, 6, null));
        assertStatus(HttpStatus.BAD_REQUEST, () -> imovelService.buscar(vazio, -1, 6, null));
        assertStatus(HttpStatus.BAD_REQUEST, () -> imovelService.buscar(vazio, 0, 0, null));
        assertStatus(HttpStatus.BAD_REQUEST, () -> imovelService.buscar(vazio, 0, 500, null));
    }

    // ---------- painéis ----------

    @Test
    void painelDoAdminMostraOFunilDoFluxo() {
        DashboardDTO antes = dashboardService.admin();
        long enviadasAntes = item(antes, "funil", "OFERTAS_ENVIADAS");
        long assinadosAntes = item(antes, "funil", "CONTRATOS_ASSINADOS");

        ContratoDTO contrato = contratoAprovado(imovel);
        contratoService.assinar(cliente.getEmail(), contrato.id(), new AssinaturaDTO("Maria da Silva", true));

        DashboardDTO depois = dashboardService.admin();
        assertEquals(enviadasAntes + 1, item(depois, "funil", "OFERTAS_ENVIADAS"));
        assertEquals(assinadosAntes + 1, item(depois, "funil", "CONTRATOS_ASSINADOS"));
        assertEquals(6, depois.graficos().get("ofertasPorMes").size(), "sempre seis meses");
        assertTrue(((BigDecimal) depois.indicadores().get("valorAssinado")).compareTo(new BigDecimal("480000")) >= 0);
    }

    @Test
    void painelDoClienteContaContratosParaAssinar() {
        contratoAprovado(imovel);
        favoritoService.adicionar(cliente.getEmail(), imovel.getId());
        DashboardDTO painel = dashboardService.cliente(cliente.getEmail());
        assertEquals(1L, ((Number) painel.indicadores().get("contratosParaAssinar")).longValue());
        assertEquals(1L, ((Number) painel.indicadores().get("favoritos")).longValue());
        assertEquals(1L, item(painel, "ofertasPorStatus", "ACEITA"));
    }

    @Test
    void painelDoCorretorMostraContratosReprovados() {
        ContratoDTO contrato = contratoService.preparar(corretor.getEmail(),
                new ContratoRequestDTO(ofertaAceita(imovel).id(), null, "À vista", CONDICOES));
        contratoService.reprovar(admin.getEmail(), contrato.id(), "Ajustar condições");
        DashboardDTO painel = dashboardService.corretor(corretor.getEmail());
        assertEquals(1L, ((Number) painel.indicadores().get("contratosReprovados")).longValue());
        assertEquals(1L, item(painel, "contratosPorStatus", "REPROVADO"));
    }

    // ---------- perfis ----------

    @Test
    void trocarSenhaExigeASenhaAtual() {
        assertStatus(HttpStatus.BAD_REQUEST, () -> perfilService.atualizar(cliente.getEmail(), new PerfilUpdateDTO(null, "errada", "nova123")));
        UserDTO atualizado = perfilService.atualizar(cliente.getEmail(), new PerfilUpdateDTO("Maria S.", "123", "nova123"));
        assertEquals("Maria S.", atualizado.getNome());
        assertTrue(passwordEncoder.matches("nova123", userRepository.findByEmail(cliente.getEmail()).orElseThrow().getSenha()));
    }

    @Test
    void cadastroDeUsuarioValidaPerfilEEmailDuplicado() {
        UserDTO novo = new UserDTO(null, "Novo Corretor", "novo.corretor@email.com", "corretor");
        novo.setSenha("123");
        assertEquals("CORRETOR", userService.insert(novo).getTipo());

        UserDTO duplicado = new UserDTO(null, "Outro", "novo.corretor@email.com", "USER");
        duplicado.setSenha("123");
        assertStatus(HttpStatus.CONFLICT, () -> userService.insert(duplicado));

        UserDTO perfilInvalido = new UserDTO(null, "Outro", "outro@email.com", "GERENTE");
        perfilInvalido.setSenha("123");
        assertStatus(HttpStatus.BAD_REQUEST, () -> userService.insert(perfilInvalido));
    }

    // ---------- auxiliares ----------

    private OfertaDTO ofertaAceita(ImovelModel alvo) {
        OfertaDTO oferta = ofertaService.criar(cliente.getEmail(), new OfertaRequestDTO(alvo.getId(), new BigDecimal("480000"), null));
        return ofertaService.aceitar(corretor.getEmail(), oferta.id());
    }

    private ContratoDTO contratoAprovado(ImovelModel alvo) {
        ContratoDTO contrato = contratoService.preparar(corretor.getEmail(),
                new ContratoRequestDTO(ofertaAceita(alvo).id(), null, "À vista", CONDICOES));
        return contratoService.aprovar(admin.getEmail(), contrato.id());
    }

    private static long item(DashboardDTO painel, String grafico, String rotulo) {
        Map<String, Long> valores = painel.graficos().get(grafico).stream()
                .collect(Collectors.toMap(ItemGraficoDTO::rotulo, ItemGraficoDTO::quantidade));
        return valores.getOrDefault(rotulo, 0L);
    }

    private static void assertStatus(HttpStatus esperado, Executable acao) {
        NegocioException erro = assertThrows(NegocioException.class, acao);
        assertEquals(esperado, erro.getStatus(), erro.getMessage());
    }

    private UserModel usuario(String nome, String email, String tipo) {
        UserModel usuario = new UserModel();
        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode("123"));
        usuario.setTipo(tipo);
        return userRepository.save(usuario);
    }

    private ImovelModel imovel(String titulo, String finalidade, String precoVenda, String precoAluguel) {
        ImovelModel novo = new ImovelModel();
        novo.setTitulo(titulo);
        novo.setFinalidade(finalidade);
        novo.setStatus("DISPONIVEL");
        novo.setPrecoVenda(precoVenda == null ? null : new BigDecimal(precoVenda));
        novo.setPrecoAluguel(precoAluguel == null ? null : new BigDecimal(precoAluguel));
        novo.setDormitorios(2);
        return imovelRepository.save(novo);
    }
}
