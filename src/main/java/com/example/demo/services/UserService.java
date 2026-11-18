package com.example.demo.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.DTOs.UserDTO;
import com.example.demo.exceptions.NegocioException;
import com.example.demo.models.Perfis;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;

@Service
public class UserService {
    @Autowired
    private UserRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<UserModel> getAllUsers() {
        List<UserModel> lista = repository.findAll();
        return lista;
    }

    public UserModel find(Integer id) {
        Optional<UserModel> user = repository.findById(id);
        return user.orElse(null);
    }

    public UserModel insert(UserModel user) {
        return repository.save(user);
    }

    public UserModel update(UserModel user) {
        try{
            UserModel usuario = find(user.getId());

            if (usuario == null) {
                return null;
            }

            else{
                if  (user.getNome() != null) {
                    usuario.setNome(user.getNome());
                }
                if  (user.getEmail() != null) {
                    usuario.setEmail(user.getEmail());
                }
                if  (user.getSenha() != null) {
                    usuario.setSenha(passwordEncoder.encode(user.getSenha()));
                }
                return repository.save(usuario);
            }
        }
        catch (Exception e) {
            return null;
        }
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    public UserModel insert(UserDTO dto) {
        if (dto.getNome() == null || dto.getNome().isBlank()) {
            throw NegocioException.invalido("Informe o nome do usuário.");
        }
        if (dto.getEmail() == null || !dto.getEmail().contains("@")) {
            throw NegocioException.invalido("Informe um e-mail válido.");
        }
        if (dto.getSenha() == null || dto.getSenha().isBlank()) {
            throw NegocioException.invalido("Informe uma senha.");
        }
        String tipo = Perfis.normalizar(dto.getTipo());
        if (!Perfis.TODOS.contains(tipo)) {
            throw NegocioException.invalido("Perfil inválido. Use USER, CORRETOR ou ADMIN.");
        }
        if (repository.findByEmail(dto.getEmail().trim()).isPresent()) {
            throw NegocioException.conflito("Já existe um usuário com este e-mail.");
        }

        UserModel model = new UserModel();
        model.setNome(dto.getNome().trim());
        model.setEmail(dto.getEmail().trim());
        model.setTipo(tipo);
        // a senha é salva criptografada (BCrypt), senão o login não funciona
        model.setSenha(passwordEncoder.encode(dto.getSenha()));
        return repository.save(model);
    }

    public UserModel update(UserDTO dto) {
        UserModel model = find(dto.getId());
        try {
            if (model != null) {
                if (dto.getNome() != null) {
                    model.setNome(dto.getNome());
                }
                if (dto.getEmail() != null) {
                    model.setEmail(dto.getEmail());
                }
                // só troca o perfil quando um perfil válido for enviado
                if (dto.getTipo() != null && Perfis.TODOS.contains(Perfis.normalizar(dto.getTipo()))) {
                    model.setTipo(Perfis.normalizar(dto.getTipo()));
                }
                if (dto.getSenha() != null) {
                    model.setSenha(passwordEncoder.encode(dto.getSenha()));
                }
                return repository.save(model);
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}
