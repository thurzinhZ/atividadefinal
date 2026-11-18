package com.example.demo.models;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "contratos")
@Getter
@Setter
public class ContratoModel implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // cada oferta aceita gera no máximo um contrato
    @OneToOne
    @JoinColumn(name = "oferta_id", nullable = false, unique = true)
    private OfertaModel oferta;

    @ManyToOne
    @JoinColumn(name = "imovel_id", nullable = false)
    private ImovelModel imovel;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private UserModel cliente;

    @ManyToOne
    @JoinColumn(name = "corretor_id", nullable = false)
    private UserModel corretor;

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal valor;

    @Column(name = "forma_pagamento")
    private String formaPagamento;

    @Column(columnDefinition = "text")
    private String condicoes;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private StatusContrato status;

    // preenchido quando o administrador reprova
    @Column(name = "motivo_reprovacao", columnDefinition = "text")
    private String motivoReprovacao;

    // administrador que aprovou ou reprovou
    @ManyToOne
    @JoinColumn(name = "avaliado_por_id")
    private UserModel avaliadoPor;

    @Column(name = "criado_em")
    private LocalDateTime criadoEm;

    @Column(name = "enviado_em")
    private LocalDateTime enviadoEm;

    @Column(name = "avaliado_em")
    private LocalDateTime avaliadoEm;

    @Column(name = "assinado_em")
    private LocalDateTime assinadoEm;

    @Column(name = "assinatura_nome")
    private String assinaturaNome;

    // código de verificação gerado na assinatura (SHA-256)
    @Column(name = "assinatura_codigo", length = 64)
    private String assinaturaCodigo;

    @Override
    public int hashCode() {
        return id == null ? 0 : id.hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        ContratoModel other = (ContratoModel) obj;
        return id != null && id.equals(other.id);
    }
}
