package com.example.demo.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.DTOs.PerfilUpdateDTO;
import com.example.demo.DTOs.UserDTO;
import com.example.demo.services.PerfilService;

// Dados do usuário logado (qualquer perfil)
@RestController
@RequestMapping("/perfil")
public class PerfilController {

    private final PerfilService service;

    public PerfilController(PerfilService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<UserDTO> meuPerfil(Authentication auth) {
        return ResponseEntity.ok(service.buscar(auth.getName()));
    }

    @PutMapping
    public ResponseEntity<UserDTO> atualizar(Authentication auth, @RequestBody PerfilUpdateDTO dto) {
        return ResponseEntity.ok(service.atualizar(auth.getName(), dto));
    }
}
