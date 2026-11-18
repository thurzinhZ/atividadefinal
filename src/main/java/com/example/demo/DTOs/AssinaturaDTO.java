package com.example.demo.DTOs;

// corpo do PATCH /contratos/{id}/assinar: { "nomeAssinatura": "Maria Silva", "aceite": true }
public record AssinaturaDTO(String nomeAssinatura, Boolean aceite) {
}
