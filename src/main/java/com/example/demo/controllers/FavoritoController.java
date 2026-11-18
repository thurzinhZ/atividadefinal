package com.example.demo.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.models.ImovelModel;
import com.example.demo.services.FavoritoService;

// Favoritos do usuário logado (qualquer perfil autenticado)
@RestController
@RequestMapping("/favoritos")
public class FavoritoController {

    private final FavoritoService service;

    public FavoritoController(FavoritoService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ImovelModel>> listar(Authentication auth) {
        return ResponseEntity.ok(service.listar(auth.getName()));
    }

    // só os ids, para marcar os corações na vitrine
    @GetMapping("/ids")
    public ResponseEntity<List<Integer>> ids(Authentication auth) {
        return ResponseEntity.ok(service.listarIds(auth.getName()));
    }

    @PostMapping("/{imovelId}")
    public ResponseEntity<Void> adicionar(Authentication auth, @PathVariable Integer imovelId) {
        boolean criado = service.adicionar(auth.getName(), imovelId);
        return ResponseEntity.status(criado ? HttpStatus.CREATED : HttpStatus.OK).build();
    }

    @DeleteMapping("/{imovelId}")
    public ResponseEntity<Void> remover(Authentication auth, @PathVariable Integer imovelId) {
        service.remover(auth.getName(), imovelId);
        return ResponseEntity.noContent().build();
    }
}
