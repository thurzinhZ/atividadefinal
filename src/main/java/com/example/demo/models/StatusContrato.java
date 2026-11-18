package com.example.demo.models;

// AGUARDANDO_APROVACAO -> APROVADO -> ASSINADO
//                      -> REPROVADO -> (corretor revisa) -> AGUARDANDO_APROVACAO
public enum StatusContrato {
    AGUARDANDO_APROVACAO,
    APROVADO,
    REPROVADO,
    ASSINADO
}
