package com.example.demo.DTOs;

import java.util.List;
import java.util.Map;

// indicadores: números soltos (cards); graficos: séries por nome
public record DashboardDTO(Map<String, Object> indicadores, Map<String, List<ItemGraficoDTO>> graficos) {
}
