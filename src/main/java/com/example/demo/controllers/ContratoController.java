package com.example.demo.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.DTOs.AssinaturaDTO;
import com.example.demo.DTOs.ContratoDTO;
import com.example.demo.DTOs.ContratoRequestDTO;
import com.example.demo.DTOs.MotivoDTO;
import com.example.demo.services.ContratoService;

@RestController
@RequestMapping("/contratos")
public class ContratoController {

    private final ContratoService service;

    public ContratoController(ContratoService service) {
        this.service = service;
    }

    // ADMIN vê todos, CORRETOR os seus, USER os que ele é cliente
    @GetMapping
    public ResponseEntity<List<ContratoDTO>> listar(Authentication auth) {
        return ResponseEntity.ok(service.listar(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContratoDTO> buscar(Authentication auth, @PathVariable Integer id) {
        return ResponseEntity.ok(service.buscar(auth.getName(), id));
    }

    // corretor prepara e envia para aprovação
    @PreAuthorize("hasRole('CORRETOR')")
    @PostMapping
    public ResponseEntity<ContratoDTO> preparar(Authentication auth, @RequestBody ContratoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.preparar(auth.getName(), dto));
    }

    // corretor revisa um contrato reprovado e reenvia
    @PreAuthorize("hasRole('CORRETOR')")
    @PutMapping("/{id}")
    public ResponseEntity<ContratoDTO> revisar(Authentication auth, @PathVariable Integer id,
            @RequestBody ContratoRequestDTO dto) {
        return ResponseEntity.ok(service.revisar(auth.getName(), id, dto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/aprovar")
    public ResponseEntity<ContratoDTO> aprovar(Authentication auth, @PathVariable Integer id) {
        return ResponseEntity.ok(service.aprovar(auth.getName(), id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/reprovar")
    public ResponseEntity<ContratoDTO> reprovar(Authentication auth, @PathVariable Integer id,
            @RequestBody(required = false) MotivoDTO dto) {
        return ResponseEntity.ok(service.reprovar(auth.getName(), id, dto == null ? null : dto.motivo()));
    }

    // cliente assina
    @PreAuthorize("hasRole('USER')")
    @PatchMapping("/{id}/assinar")
    public ResponseEntity<ContratoDTO> assinar(Authentication auth, @PathVariable Integer id,
            @RequestBody AssinaturaDTO dto) {
        return ResponseEntity.ok(service.assinar(auth.getName(), id, dto));
    }
}
