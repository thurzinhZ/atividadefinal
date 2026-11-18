package com.example.demo.models;

import java.util.Set;

// Status usados pelo fluxo de negociação. Imóveis com status nulo ou diferente
// destes (ex.: dados antigos do banco) são tratados como disponíveis.
public final class StatusImovel {
    public static final String DISPONIVEL = "DISPONIVEL";
    public static final String EM_NEGOCIACAO = "EM_NEGOCIACAO";
    public static final String VENDIDO = "VENDIDO";
    public static final String ALUGADO = "ALUGADO";
    public static final String INATIVO = "INATIVO";

    private static final Set<String> INDISPONIVEIS = Set.of(EM_NEGOCIACAO, VENDIDO, ALUGADO, INATIVO);

    private StatusImovel() {
    }

    public static boolean disponivel(ImovelModel imovel) {
        String status = imovel.getStatus();
        return status == null || !INDISPONIVEIS.contains(status.trim().toUpperCase());
    }

    public static String finalizado(ImovelModel imovel) {
        return "ALUGUEL".equalsIgnoreCase(imovel.getFinalidade()) ? ALUGADO : VENDIDO;
    }
}
