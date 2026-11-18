package com.example.demo.DTOs;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.demo.models.OfertaModel;

// Resposta de oferta sem expor a entidade (e a senha) dos usuários
public record OfertaDTO(
        Integer id,
        Integer imovelId,
        String imovelTitulo,
        String imovelFinalidade,
        String imovelStatus,
        Integer clienteId,
        String clienteNome,
        String clienteEmail,
        String corretorNome,
        String corretorEmail,
        BigDecimal valor,
        String mensagem,
        String resposta,
        String status,
        String criadaEm,
        String respondidaEm,
        Integer contratoId) {

    public static OfertaDTO de(OfertaModel o, Integer contratoId) {
        return new OfertaDTO(
                o.getId(),
                o.getImovel().getId(),
                o.getImovel().getTitulo(),
                o.getImovel().getFinalidade(),
                o.getImovel().getStatus(),
                o.getCliente().getId(),
                o.getCliente().getNome(),
                o.getCliente().getEmail(),
                o.getCorretor() != null ? o.getCorretor().getNome() : null,
                o.getCorretor() != null ? o.getCorretor().getEmail() : null,
                o.getValor(),
                o.getMensagem(),
                o.getResposta(),
                o.getStatus().name(),
                texto(o.getCriadaEm()),
                texto(o.getRespondidaEm()),
                contratoId);
    }

    static String texto(LocalDateTime data) {
        return data == null ? null : data.toString();
    }
}
