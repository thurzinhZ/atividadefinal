package com.example.demo.config;

import java.math.BigDecimal;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.demo.models.ImovelModel;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.UserRepository;

// Como só o ADMIN pode cadastrar usuários, o primeiro ADMIN precisa ser criado
// quando a aplicação sobe. Também cria um USER e um imóvel para testar.
@Component
public class DadosIniciais implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ImovelRepository imovelRepository;
    private final PasswordEncoder passwordEncoder;

    public DadosIniciais(UserRepository userRepository, ImovelRepository imovelRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.imovelRepository = imovelRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail("admin@email.com").isEmpty()) {
            UserModel admin = new UserModel();
            admin.setNome("Administrador");
            admin.setEmail("admin@email.com");
            admin.setSenha(passwordEncoder.encode("123"));
            admin.setTipo("ADMIN");
            userRepository.save(admin);
        }

        if (userRepository.findByEmail("user@email.com").isEmpty()) {
            UserModel user = new UserModel();
            user.setNome("Usuario");
            user.setEmail("user@email.com");
            user.setSenha(passwordEncoder.encode("123"));
            user.setTipo("USER");
            userRepository.save(user);
        }

        if (imovelRepository.count() == 0) {
            ImovelModel imovel = new ImovelModel();
            imovel.setTitulo("Casa 3 dormitórios");
            imovel.setDescricao("Casa de exemplo para testar a API");
            imovel.setPrecoVenda(new BigDecimal("350000.00"));
            imovel.setFinalidade("VENDA");
            imovel.setStatus("DISPONIVEL");
            imovel.setDormitorios(3);
            imovel.setEndereco("Rua das Flores");
            imovel.setNumero("100");
            imovelRepository.save(imovel);
        }
    }
}
