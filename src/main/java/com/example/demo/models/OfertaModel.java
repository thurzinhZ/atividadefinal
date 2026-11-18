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
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ofertas")
@Getter
@Setter
public class OfertaModel implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "imovel_id", nullable = false)
    private ImovelModel imovel;

    // usuário (perfil USER) que enviou a oferta
    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private UserModel cliente;

    // corretor que aceitou ou recusou (nulo enquanto está pendente)
    @ManyToOne
    @JoinColumn(name = "corretor_id")
    private UserModel corretor;

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal valor;

    @Column(columnDefinition = "text")
    private String mensagem;

    // resposta do corretor (ex.: motivo da recusa)
    @Column(columnDefinition = "text")
    private String resposta;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private StatusOferta status;

    @Column(name = "criada_em")
    private LocalDateTime criadaEm;

    @Column(name = "respondida_em")
    private LocalDateTime respondidaEm;

    @Override
    public int hashCode() {
        return id == null ? 0 : id.hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        OfertaModel other = (OfertaModel) obj;
        return id != null && id.equals(other.id);
    }
}
