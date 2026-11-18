package com.example.demo.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.function.Predicate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.DTOs.DashboardDTO;
import com.example.demo.DTOs.ItemGraficoDTO;
import com.example.demo.models.ContratoModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.models.Perfis;
import com.example.demo.models.StatusContrato;
import com.example.demo.models.StatusImovel;
import com.example.demo.models.StatusOferta;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.ContratoRepository;
import com.example.demo.repositories.FavoritoRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.OfertaRepository;
import com.example.demo.repositories.UserRepository;

// Monta os dados dos painéis (cards + gráficos) de cada perfil.
// Os totais são calculados em memória: simples e suficiente para o volume do projeto.
@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final int MESES = 6;

    private final ImovelRepository imovelRepository;
    private final OfertaRepository ofertaRepository;
    private final ContratoRepository contratoRepository;
    private final FavoritoRepository favoritoRepository;
    private final UserRepository userRepository;
    private final UsuarioLogadoService usuarioLogado;

    public DashboardService(ImovelRepository imovelRepository, OfertaRepository ofertaRepository,
            ContratoRepository contratoRepository, FavoritoRepository favoritoRepository,
            UserRepository userRepository, UsuarioLogadoService usuarioLogado) {
        this.imovelRepository = imovelRepository;
        this.ofertaRepository = ofertaRepository;
        this.contratoRepository = contratoRepository;
        this.favoritoRepository = favoritoRepository;
        this.userRepository = userRepository;
        this.usuarioLogado = usuarioLogado;
    }

    public DashboardDTO admin() {
        List<ImovelModel> imoveis = imovelRepository.findAll();
        List<OfertaModel> ofertas = ofertaRepository.findAll();
        List<ContratoModel> contratos = contratoRepository.findAll();
        List<UserModel> usuarios = userRepository.findAll();

        Map<String, Object> indicadores = new LinkedHashMap<>();
        indicadores.put("imoveis", imoveis.size());
        indicadores.put("imoveisDisponiveis", imoveis.stream().filter(StatusImovel::disponivel).count());
        indicadores.put("usuarios", usuarios.size());
        indicadores.put("ofertasPendentes", contar(ofertas, o -> o.getStatus() == StatusOferta.PENDENTE));
        indicadores.put("contratosAguardandoAprovacao", contar(contratos, c -> c.getStatus() == StatusContrato.AGUARDANDO_APROVACAO));
        indicadores.put("valorAssinado", somar(contratos, c -> c.getStatus() == StatusContrato.ASSINADO));

        Map<String, List<ItemGraficoDTO>> graficos = new LinkedHashMap<>();
        graficos.put("imoveisPorStatus", imoveisPorStatus(imoveis));
        graficos.put("ofertasPorStatus", porEnum(ofertas, StatusOferta.values(), OfertaModel::getStatus, OfertaModel::getValor));
        graficos.put("contratosPorStatus", porEnum(contratos, StatusContrato.values(), ContratoModel::getStatus, ContratoModel::getValor));
        graficos.put("ofertasPorMes", porMes(ofertas, OfertaModel::getCriadaEm, OfertaModel::getValor));
        graficos.put("contratosAssinadosPorMes", porMes(
                contratos.stream().filter(c -> c.getStatus() == StatusContrato.ASSINADO).toList(),
                ContratoModel::getAssinadoEm, ContratoModel::getValor));
        graficos.put("usuariosPorPerfil", usuariosPorPerfil(usuarios));
        graficos.put("funil", funil(ofertas, contratos));
        return new DashboardDTO(indicadores, graficos);
    }

    public DashboardDTO corretor(String email) {
        UserModel corretor = usuarioLogado.buscar(email);
        List<OfertaModel> todas = ofertaRepository.findAll();
        List<OfertaModel> minhas = todas.stream()
                .filter(o -> o.getCorretor() != null && o.getCorretor().getId().equals(corretor.getId()))
                .toList();
        List<ContratoModel> contratos = contratoRepository.findByCorretorIdOrderByCriadoEmDesc(corretor.getId());

        Map<String, Object> indicadores = new LinkedHashMap<>();
        indicadores.put("ofertasPendentes", contar(todas, o -> o.getStatus() == StatusOferta.PENDENTE));
        indicadores.put("ofertasAceitas", contar(minhas, o -> o.getStatus() == StatusOferta.ACEITA));
        indicadores.put("contratosEmAndamento", contar(contratos, c -> c.getStatus() != StatusContrato.ASSINADO));
        indicadores.put("contratosReprovados", contar(contratos, c -> c.getStatus() == StatusContrato.REPROVADO));
        indicadores.put("valorAssinado", somar(contratos, c -> c.getStatus() == StatusContrato.ASSINADO));

        Map<String, List<ItemGraficoDTO>> graficos = new LinkedHashMap<>();
        // pendentes ainda não têm corretor: entram no gráfico para mostrar a fila de trabalho
        List<OfertaModel> ofertasDoCorretor = new ArrayList<>(minhas);
        todas.stream().filter(o -> o.getStatus() == StatusOferta.PENDENTE).forEach(ofertasDoCorretor::add);
        graficos.put("ofertasPorStatus", porEnum(ofertasDoCorretor, StatusOferta.values(), OfertaModel::getStatus, OfertaModel::getValor));
        graficos.put("contratosPorStatus", porEnum(contratos, StatusContrato.values(), ContratoModel::getStatus, ContratoModel::getValor));
        graficos.put("ofertasRespondidasPorMes", porMes(minhas, OfertaModel::getRespondidaEm, OfertaModel::getValor));
        return new DashboardDTO(indicadores, graficos);
    }

    public DashboardDTO cliente(String email) {
        UserModel cliente = usuarioLogado.buscar(email);
        List<OfertaModel> ofertas = ofertaRepository.findByClienteIdOrderByCriadaEmDesc(cliente.getId());
        List<ContratoModel> contratos = contratoRepository.findByClienteIdOrderByCriadoEmDesc(cliente.getId());

        Map<String, Object> indicadores = new LinkedHashMap<>();
        indicadores.put("favoritos", favoritoRepository.countByUsuarioId(cliente.getId()));
        indicadores.put("ofertasPendentes", contar(ofertas, o -> o.getStatus() == StatusOferta.PENDENTE));
        indicadores.put("contratosParaAssinar", contar(contratos, c -> c.getStatus() == StatusContrato.APROVADO));
        indicadores.put("contratosAssinados", contar(contratos, c -> c.getStatus() == StatusContrato.ASSINADO));

        Map<String, List<ItemGraficoDTO>> graficos = new LinkedHashMap<>();
        graficos.put("ofertasPorStatus", porEnum(ofertas, StatusOferta.values(), OfertaModel::getStatus, OfertaModel::getValor));
        graficos.put("contratosPorStatus", porEnum(contratos, StatusContrato.values(), ContratoModel::getStatus, ContratoModel::getValor));
        return new DashboardDTO(indicadores, graficos);
    }

    // escolhe o painel conforme o perfil do usuário logado
    public DashboardDTO doUsuario(String email) {
        UserModel usuario = usuarioLogado.buscar(email);
        return switch (Perfis.de(usuario)) {
            case Perfis.ADMIN -> admin();
            case Perfis.CORRETOR -> corretor(email);
            default -> cliente(email);
        };
    }

    private static <T> long contar(List<T> itens, Predicate<T> condicao) {
        return itens.stream().filter(condicao).count();
    }

    private static BigDecimal somar(List<ContratoModel> contratos, Predicate<ContratoModel> condicao) {
        return contratos.stream().filter(condicao).map(ContratoModel::getValor)
                .filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static <T, E extends Enum<E>> List<ItemGraficoDTO> porEnum(List<T> itens, E[] valores,
            Function<T, E> status, Function<T, BigDecimal> valor) {
        return Arrays.stream(valores).map(v -> {
            List<T> doStatus = itens.stream().filter(i -> status.apply(i) == v).toList();
            return new ItemGraficoDTO(v.name(), doStatus.size(), total(doStatus, valor));
        }).toList();
    }

    // últimos 6 meses, incluindo meses sem movimento (quantidade 0)
    private static <T> List<ItemGraficoDTO> porMes(List<T> itens, Function<T, LocalDateTime> data,
            Function<T, BigDecimal> valor) {
        YearMonth atual = YearMonth.now();
        List<ItemGraficoDTO> meses = new ArrayList<>();
        for (int i = MESES - 1; i >= 0; i--) {
            YearMonth mes = atual.minusMonths(i);
            List<T> doMes = itens.stream()
                    .filter(item -> data.apply(item) != null && YearMonth.from(data.apply(item)).equals(mes))
                    .toList();
            meses.add(new ItemGraficoDTO(mes.toString(), doMes.size(), total(doMes, valor)));
        }
        return meses;
    }

    private static List<ItemGraficoDTO> imoveisPorStatus(List<ImovelModel> imoveis) {
        Map<String, Long> contagem = new LinkedHashMap<>();
        for (String status : List.of(StatusImovel.DISPONIVEL, StatusImovel.EM_NEGOCIACAO, StatusImovel.VENDIDO, StatusImovel.ALUGADO)) {
            contagem.put(status, 0L);
        }
        for (ImovelModel imovel : imoveis) {
            String status = StatusImovel.disponivel(imovel) ? StatusImovel.DISPONIVEL : imovel.getStatus().trim().toUpperCase();
            contagem.merge(status, 1L, Long::sum);
        }
        return contagem.entrySet().stream().map(e -> new ItemGraficoDTO(e.getKey(), e.getValue(), null)).toList();
    }

    private static List<ItemGraficoDTO> usuariosPorPerfil(List<UserModel> usuarios) {
        return List.of(Perfis.USER, Perfis.CORRETOR, Perfis.ADMIN).stream()
                .map(p -> new ItemGraficoDTO(p, usuarios.stream().filter(u -> p.equals(Perfis.de(u))).count(), null))
                .toList();
    }

    // etapas do checkpoint: oferta enviada -> aceita -> contrato aprovado -> assinado
    private static List<ItemGraficoDTO> funil(List<OfertaModel> ofertas, List<ContratoModel> contratos) {
        long aceitas = contar(ofertas, o -> o.getStatus() == StatusOferta.ACEITA);
        long aprovados = contar(contratos, c -> c.getStatus() == StatusContrato.APROVADO || c.getStatus() == StatusContrato.ASSINADO);
        long assinados = contar(contratos, c -> c.getStatus() == StatusContrato.ASSINADO);
        return List.of(
                new ItemGraficoDTO("OFERTAS_ENVIADAS", ofertas.size(), null),
                new ItemGraficoDTO("OFERTAS_ACEITAS", aceitas, null),
                new ItemGraficoDTO("CONTRATOS_APROVADOS", aprovados, null),
                new ItemGraficoDTO("CONTRATOS_ASSINADOS", assinados, null));
    }

    private static <T> BigDecimal total(List<T> itens, Function<T, BigDecimal> valor) {
        return itens.stream().map(valor).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
