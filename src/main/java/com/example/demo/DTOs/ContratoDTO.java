package com.example.demo.DTOs;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.demo.models.ContratoModel;

public record ContratoDTO(
        Integer id,
        Integer ofertaId,
        Integer imovelId,
        String imovelTitulo,
        String imovelFinalidade,
        String imovelStatus,
        String clienteNome,
        String clienteEmail,
        String corretorNome,
        String corretorEmail,
        BigDecimal valor,
        BigDecimal valorOferta,
        String formaPagamento,
        String condicoes,
        String status,
        String motivoReprovacao,
        String avaliadoPorNome,
        String criadoEm,
        String enviadoEm,
        String avaliadoEm,
        String assinadoEm,
        String assinaturaNome,
        String assinaturaCodigo) {

    public static ContratoDTO de(ContratoModel c) {
        return new ContratoDTO(
                c.getId(),
                c.getOferta().getId(),
                c.getImovel().getId(),
                c.getImovel().getTitulo(),
                c.getImovel().getFinalidade(),
                c.getImovel().getStatus(),
                c.getCliente().getNome(),
                c.getCliente().getEmail(),
                c.getCorretor().getNome(),
                c.getCorretor().getEmail(),
                c.getValor(),
                c.getOferta().getValor(),
                c.getFormaPagamento(),
                c.getCondicoes(),
                c.getStatus().name(),
                c.getMotivoReprovacao(),
                c.getAvaliadoPor() != null ? c.getAvaliadoPor().getNome() : null,
                texto(c.getCriadoEm()),
                texto(c.getEnviadoEm()),
                texto(c.getAvaliadoEm()),
                texto(c.getAssinadoEm()),
                c.getAssinaturaNome(),
                c.getAssinaturaCodigo());
    }

    private static String texto(LocalDateTime data) {
        return data == null ? null : data.toString();
    }
}
