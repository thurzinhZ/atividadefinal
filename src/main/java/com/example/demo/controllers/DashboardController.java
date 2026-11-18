package com.example.demo.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.DTOs.DashboardDTO;
import com.example.demo.services.DashboardService;

// Dados dos painéis com gráficos
@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    // painel do perfil do usuário logado
    @GetMapping
    public ResponseEntity<DashboardDTO> meu(Authentication auth) {
        return ResponseEntity.ok(service.doUsuario(auth.getName()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<DashboardDTO> admin() {
        return ResponseEntity.ok(service.admin());
    }

    @PreAuthorize("hasRole('CORRETOR')")
    @GetMapping("/corretor")
    public ResponseEntity<DashboardDTO> corretor(Authentication auth) {
        return ResponseEntity.ok(service.corretor(auth.getName()));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/cliente")
    public ResponseEntity<DashboardDTO> cliente(Authentication auth) {
        return ResponseEntity.ok(service.cliente(auth.getName()));
    }
}
