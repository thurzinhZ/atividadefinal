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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.DTOs.MotivoDTO;
import com.example.demo.DTOs.OfertaDTO;
import com.example.demo.DTOs.OfertaRequestDTO;
import com.example.demo.services.OfertaService;

@RestController
@RequestMapping("/ofertas")
public class OfertaController {

    private final OfertaService service;

    public OfertaController(OfertaService service) {
        this.service = service;
    }

    // cliente envia oferta
    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<OfertaDTO> criar(Authentication auth, @RequestBody OfertaRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(auth.getName(), dto));
    }

    // cliente acompanha as próprias ofertas
    @PreAuthorize("hasRole('USER')")
    @GetMapping("/minhas")
    public ResponseEntity<List<OfertaDTO>> minhas(Authentication auth) {
        return ResponseEntity.ok(service.listarDoCliente(auth.getName()));
    }

    @PreAuthorize("hasRole('USER')")
    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<OfertaDTO> cancelar(Authentication auth, @PathVariable Integer id) {
        return ResponseEntity.ok(service.cancelar(auth.getName(), id));
    }

    // corretor e admin listam as ofertas (filtro opcional ?status=PENDENTE)
    @PreAuthorize("hasAnyRole('CORRETOR','ADMIN')")
    @GetMapping
    public ResponseEntity<List<OfertaDTO>> listar(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(service.listar(status));
    }

    @PreAuthorize("hasRole('CORRETOR')")
    @PatchMapping("/{id}/aceitar")
    public ResponseEntity<OfertaDTO> aceitar(Authentication auth, @PathVariable Integer id) {
        return ResponseEntity.ok(service.aceitar(auth.getName(), id));
    }

    @PreAuthorize("hasRole('CORRETOR')")
    @PatchMapping("/{id}/recusar")
    public ResponseEntity<OfertaDTO> recusar(Authentication auth, @PathVariable Integer id,
            @RequestBody(required = false) MotivoDTO dto) {
        return ResponseEntity.ok(service.recusar(auth.getName(), id, dto == null ? null : dto.motivo()));
    }
}
