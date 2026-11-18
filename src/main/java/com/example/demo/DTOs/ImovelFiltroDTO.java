package com.example.demo.DTOs;

import java.math.BigDecimal;

// Filtros opcionais da busca de imóveis (todos podem ser nulos)
public record ImovelFiltroDTO(
        String q,
        String finalidade,
        Integer tipoId,
        Integer bairroId,
        BigDecimal precoMin,
        BigDecimal precoMax,
        Integer dormitoriosMin,
        String status) {
}
