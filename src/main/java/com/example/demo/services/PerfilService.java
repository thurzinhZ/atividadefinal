package com.example.demo.services;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.DTOs.PerfilUpdateDTO;
import com.example.demo.DTOs.UserDTO;
import com.example.demo.exceptions.NegocioException;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;

// "Meu perfil": qualquer usuário autenticado vê e altera os próprios dados
@Service
@Transactional
public class PerfilService {

    public static final int SENHA_MINIMA = 3;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioLogadoService usuarioLogado;

    public PerfilService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            UsuarioLogadoService usuarioLogado) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.usuarioLogado = usuarioLogado;
    }

    @Transactional(readOnly = true)
    public UserDTO buscar(String email) {
        return new UserDTO(usuarioLogado.buscar(email));
    }

    public UserDTO atualizar(String email, PerfilUpdateDTO dto) {
        UserModel usuario = usuarioLogado.buscar(email);
        if (dto == null) {
            throw NegocioException.invalido("Informe os dados do perfil.");
        }
        if (dto.nome() != null) {
            if (dto.nome().isBlank()) {
                throw NegocioException.invalido("O nome não pode ficar em branco.");
            }
            usuario.setNome(dto.nome().trim());
        }
        if (dto.novaSenha() != null && !dto.novaSenha().isEmpty()) {
            if (dto.senhaAtual() == null || !passwordEncoder.matches(dto.senhaAtual(), usuario.getSenha())) {
                throw NegocioException.invalido("A senha atual está incorreta.");
            }
            if (dto.novaSenha().length() < SENHA_MINIMA) {
                throw NegocioException.invalido("A nova senha deve ter pelo menos " + SENHA_MINIMA + " caracteres.");
            }
            usuario.setSenha(passwordEncoder.encode(dto.novaSenha()));
        }
        return new UserDTO(userRepository.save(usuario));
    }
}
