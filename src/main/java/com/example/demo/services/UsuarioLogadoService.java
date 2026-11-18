package com.example.demo.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.example.demo.exceptions.NegocioException;
import com.example.demo.models.Perfis;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;

// Busca o usuário do token (o e-mail vem de authentication.getName()) e confere o perfil
@Service
public class UsuarioLogadoService {

    private final UserRepository userRepository;

    public UsuarioLogadoService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserModel buscar(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NegocioException(HttpStatus.UNAUTHORIZED, "Usuário da sessão não encontrado."));
    }

    public UserModel exigirPerfil(String email, String perfil, String mensagem) {
        UserModel usuario = buscar(email);
        if (!perfil.equals(Perfis.de(usuario))) {
            throw NegocioException.proibido(mensagem);
        }
        return usuario;
    }
}
