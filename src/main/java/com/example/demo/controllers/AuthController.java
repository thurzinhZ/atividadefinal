package com.example.demo.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.DTOs.AuthResponseDTO;
import com.example.demo.DTOs.LoginRequestDTO;
import com.example.demo.DTOs.UserDTO;
import com.example.demo.services.AuthService;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@RequestBody UserDTO dto) {
        try {
            return ResponseEntity.ok(authService.register(dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthResponseDTO(null, null, null));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO dto) {
        try {
            return ResponseEntity.ok(authService.login(dto));
        } catch (Exception e) {
            // e-mail ou senha errados
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}
