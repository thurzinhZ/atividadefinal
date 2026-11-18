package com.example.demo.DTOs;

import java.math.BigDecimal;

// corpo para preparar (POST /contratos) e revisar (PUT /contratos/{id}) um contrato
public record ContratoRequestDTO(Integer ofertaId, BigDecimal valor, String formaPagamento, String condicoes) {
}
