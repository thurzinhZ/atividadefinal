package com.example.demo.DTOs;

import java.math.BigDecimal;

// corpo do POST /ofertas: { "imovelId": 1, "valor": 340000, "mensagem": "..." }
public record OfertaRequestDTO(Integer imovelId, BigDecimal valor, String mensagem) {
}
