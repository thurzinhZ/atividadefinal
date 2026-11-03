package com.example.demo.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.DTOs.UserDTO;
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
        UserModel model = new UserModel();
        model.setNome(dto.getNome());
        model.setEmail(dto.getEmail());
        model.setTipo(dto.getTipo() != null ? dto.getTipo() : "USER");
        // a senha é salva criptografada (BCrypt), senão o login não funciona
        model.setSenha(passwordEncoder.encode(dto.getSenha()));
        return repository.save(model);
    }

    public UserModel update(UserDTO dto) {
        UserModel model = find(dto.getId());
        try {
            if (model != null) {
                model.setNome(dto.getNome());
                model.setEmail(dto.getEmail());
                model.setTipo(dto.getTipo());
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