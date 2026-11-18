package com.example.demo.config;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.demo.models.BairroModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.Perfis;
import com.example.demo.models.StatusImovel;
import com.example.demo.models.TipoImovelModel;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.BairroRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.TipoImovelRepository;
import com.example.demo.repositories.UserRepository;

// Como só o ADMIN pode cadastrar usuários, os usuários de teste (um de cada perfil)
// são criados quando a aplicação sobe, se ainda não existirem.
// Com app.dados-demo=true também cadastra imóveis de exemplo (para testar filtros e
// paginação). Cada imóvel de exemplo só é inserido se ainda não existir outro com o
// mesmo título, então reiniciar a aplicação não duplica nada.
@Component
public class DadosIniciais implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ImovelRepository imovelRepository;
    private final BairroRepository bairroRepository;
    private final TipoImovelRepository tipoImovelRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.dados-demo:true}")
    private boolean dadosDemo;

    public DadosIniciais(UserRepository userRepository, ImovelRepository imovelRepository,
            BairroRepository bairroRepository, TipoImovelRepository tipoImovelRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.imovelRepository = imovelRepository;
        this.bairroRepository = bairroRepository;
        this.tipoImovelRepository = tipoImovelRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        criarUsuario("Administrador", "admin@email.com", Perfis.ADMIN);
        criarUsuario("Usuario", "user@email.com", Perfis.USER);
        criarUsuario("Carla Corretora", "corretor@email.com", Perfis.CORRETOR);

        if (imovelRepository.count() == 0) {
            ImovelModel imovel = new ImovelModel();
            imovel.setTitulo("Casa 3 dormitórios");
            imovel.setDescricao("Casa de exemplo para testar a API");
            imovel.setPrecoVenda(new BigDecimal("350000.00"));
            imovel.setFinalidade("VENDA");
            imovel.setStatus(StatusImovel.DISPONIVEL);
            imovel.setDormitorios(3);
            imovel.setEndereco("Rua das Flores");
            imovel.setNumero("100");
            imovelRepository.save(imovel);
        }

        if (dadosDemo) {
            criarImoveisDemo();
        }
    }

    private void criarUsuario(String nome, String email, String tipo) {
        if (userRepository.findByEmail(email).isPresent()) {
            return;
        }
        UserModel usuario = new UserModel();
        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode("123"));
        usuario.setTipo(tipo);
        userRepository.save(usuario);
    }

    private void criarImoveisDemo() {
        TipoImovelModel casa = tipo("Casa", "Casa térrea ou sobrado");
        TipoImovelModel apartamento = tipo("Apartamento", "Unidade em condomínio vertical");
        TipoImovelModel terreno = tipo("Terreno", "Lote sem construção");

        BairroModel centro = bairro("Centro", "Santa Maria", "RS", "97010-000");
        BairroModel camobi = bairro("Camobi", "Santa Maria", "RS", "97105-000");
        BairroModel dores = bairro("Nossa Senhora das Dores", "Santa Maria", "RS", "97050-000");
        BairroModel itarare = bairro("Itararé", "Santa Maria", "RS", "97045-000");

        imovel("Apartamento com sacada no Centro", "Dois dormitórios, sala integrada e sacada com churrasqueira.",
                apartamento, centro, "VENDA", "289000", null, 2, 1, 1, "68", true);
        imovel("Casa com pátio em Camobi", "Casa térrea perto da universidade, com pátio amplo e garagem coberta.",
                casa, camobi, "VENDA", "420000", null, 3, 2, 2, "160", true);
        imovel("Studio mobiliado perto da UFSM", "Ideal para estudantes: mobiliado, com internet inclusa.",
                apartamento, camobi, "ALUGUEL", null, "1350", 1, 1, 0, "32", false);
        imovel("Sobrado em Nossa Senhora das Dores", "Sobrado com suíte, escritório e espaço gourmet.",
                casa, dores, "VENDA", "690000", null, 4, 3, 2, "230", true);
        imovel("Apartamento para alugar no Centro", "Três dormitórios, próximo ao calçadão e a mercados.",
                apartamento, centro, "ALUGUEL", null, "2400", 3, 2, 1, "98", false);
        imovel("Terreno plano em Camobi", "Terreno de esquina, pronto para construir.",
                terreno, camobi, "VENDA", "160000", null, null, null, null, "360", false);
        imovel("Casa compacta no Itararé", "Dois quartos, cozinha americana e pátio nos fundos.",
                casa, itarare, "ALUGUEL", null, "1600", 2, 1, 1, "70", false);
        imovel("Cobertura duplex no Centro", "Cobertura com terraço, vista para a cidade e duas vagas.",
                apartamento, centro, "VENDA", "980000", null, 3, 3, 2, "180", true);
        imovel("Apartamento térreo no Itararé", "Térreo com pátio privativo, aceita pets.",
                apartamento, itarare, "VENDA", "235000", null, 2, 1, 1, "60", false);
    }

    private TipoImovelModel tipo(String nome, String descricao) {
        return tipoImovelRepository.findFirstByNome(nome)
                .orElseGet(() -> tipoImovelRepository.save(new TipoImovelModel(null, nome, descricao)));
    }

    private BairroModel bairro(String nome, String cidade, String estado, String cep) {
        return bairroRepository.findFirstByNomeAndCidade(nome, cidade)
                .orElseGet(() -> bairroRepository.save(new BairroModel(null, nome, cidade, estado, cep)));
    }

    private void imovel(String titulo, String descricao, TipoImovelModel tipo, BairroModel bairro, String finalidade,
            String precoVenda, String precoAluguel, Integer dormitorios, Integer banheiros, Integer garagem,
            String area, boolean destaque) {
        if (imovelRepository.existsByTitulo(titulo)) {
            return;
        }
        ImovelModel imovel = new ImovelModel();
        imovel.setTitulo(titulo);
        imovel.setDescricao(descricao);
        imovel.setTipoImovel(tipo);
        imovel.setBairro(bairro);
        imovel.setFinalidade(finalidade);
        imovel.setStatus(StatusImovel.DISPONIVEL);
        imovel.setPrecoVenda(precoVenda == null ? null : new BigDecimal(precoVenda));
        imovel.setPrecoAluguel(precoAluguel == null ? null : new BigDecimal(precoAluguel));
        imovel.setDormitorios(dormitorios);
        imovel.setBanheiros(banheiros);
        imovel.setGaragem(garagem);
        imovel.setAreaTotal(new BigDecimal(area));
        imovel.setDestaque(destaque);
        imovel.setEndereco("Endereço sob consulta");
        imovelRepository.save(imovel);
    }
}
