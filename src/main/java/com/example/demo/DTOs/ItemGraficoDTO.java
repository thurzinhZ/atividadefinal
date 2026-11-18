package com.example.demo.DTOs;

import java.math.BigDecimal;

// um ponto/barra de gráfico: rótulo, quantidade e (opcional) valor em reais
public record ItemGraficoDTO(String rotulo, long quantidade, BigDecimal valor) {
}
