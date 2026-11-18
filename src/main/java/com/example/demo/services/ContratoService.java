package com.example.demo.services;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.DTOs.AssinaturaDTO;
import com.example.demo.DTOs.ContratoDTO;
import com.example.demo.DTOs.ContratoRequestDTO;
import com.example.demo.exceptions.NegocioException;
import com.example.demo.models.ContratoModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.models.Perfis;
import com.example.demo.models.StatusContrato;
import com.example.demo.models.StatusImovel;
import com.example.demo.models.StatusOferta;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.ContratoRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.OfertaRepository;

// Fluxo do contrato:
// 1. corretor que aceitou a oferta prepara e envia  -> AGUARDANDO_APROVACAO
// 2. administrador aprova                           -> APROVADO (aguardando assinatura)
//    ou reprova com motivo                          -> REPROVADO (corretor revisa e reenvia)
// 3. cliente dono da oferta assina                  -> ASSINADO (imóvel VENDIDO/ALUGADO)
@Service
@Transactional
public class ContratoService {

    public static final int MIN_CONDICOES = 20;

    private final ContratoRepository contratoRepository;
    private final OfertaRepository ofertaRepository;
    private final ImovelRepository imovelRepository;
    private final UsuarioLogadoService usuarioLogado;

    public ContratoService(ContratoRepository contratoRepository, OfertaRepository ofertaRepository,
            ImovelRepository imovelRepository, UsuarioLogadoService usuarioLogado) {
        this.contratoRepository = contratoRepository;
        this.ofertaRepository = ofertaRepository;
        this.imovelRepository = imovelRepository;
        this.usuarioLogado = usuarioLogado;
    }

    public ContratoDTO preparar(String emailCorretor, ContratoRequestDTO dto) {
        UserModel corretor = usuarioLogado.exigirPerfil(emailCorretor, Perfis.CORRETOR, "Apenas corretores podem preparar contratos.");
        if (dto == null || dto.ofertaId() == null) {
            throw NegocioException.invalido("Informe a oferta do contrato.");
        }
        OfertaModel oferta = ofertaRepository.findById(dto.ofertaId())
                .orElseThrow(() -> NegocioException.naoEncontrado("Oferta não encontrada."));

        if (oferta.getStatus() != StatusOferta.ACEITA) {
            throw NegocioException.conflito("Só é possível preparar contrato para uma oferta aceita.");
        }
        if (oferta.getCorretor() == null || !oferta.getCorretor().getId().equals(corretor.getId())) {
            throw NegocioException.proibido("Apenas o corretor que aceitou a oferta pode preparar o contrato.");
        }
        if (contratoRepository.existsByOfertaId(oferta.getId())) {
            throw NegocioException.conflito("Esta oferta já possui um contrato.");
        }

        BigDecimal valor = dto.valor() != null ? dto.valor() : oferta.getValor();
        validarDados(valor, dto.formaPagamento(), dto.condicoes());

        LocalDateTime agora = LocalDateTime.now();
        ContratoModel contrato = new ContratoModel();
        contrato.setOferta(oferta);
        contrato.setImovel(oferta.getImovel());
        contrato.setCliente(oferta.getCliente());
        contrato.setCorretor(corretor);
        contrato.setValor(valor);
        contrato.setFormaPagamento(dto.formaPagamento().trim());
        contrato.setCondicoes(dto.condicoes().trim());
        contrato.setStatus(StatusContrato.AGUARDANDO_APROVACAO);
        contrato.setCriadoEm(agora);
        contrato.setEnviadoEm(agora);
        return ContratoDTO.de(contratoRepository.save(contrato));
    }

    // corretor corrige um contrato reprovado (ou ainda em análise) e reenvia para aprovação
    public ContratoDTO revisar(String emailCorretor, Integer id, ContratoRequestDTO dto) {
        UserModel corretor = usuarioLogado.exigirPerfil(emailCorretor, Perfis.CORRETOR, "Apenas corretores podem revisar contratos.");
        ContratoModel contrato = buscarEntidade(id);
        if (!contrato.getCorretor().getId().equals(corretor.getId())) {
            throw NegocioException.proibido("Apenas o corretor responsável pode revisar este contrato.");
        }
        if (contrato.getStatus() != StatusContrato.REPROVADO && contrato.getStatus() != StatusContrato.AGUARDANDO_APROVACAO) {
            throw NegocioException.conflito("Contratos aprovados ou assinados não podem ser alterados.");
        }
        if (dto == null) {
            throw NegocioException.invalido("Informe os dados do contrato.");
        }
        BigDecimal valor = dto.valor() != null ? dto.valor() : contrato.getValor();
        validarDados(valor, dto.formaPagamento(), dto.condicoes());

        contrato.setValor(valor);
        contrato.setFormaPagamento(dto.formaPagamento().trim());
        contrato.setCondicoes(dto.condicoes().trim());
        contrato.setStatus(StatusContrato.AGUARDANDO_APROVACAO);
        contrato.setMotivoReprovacao(null);
        // volta para a fila de aprovação: a avaliação anterior deixa de valer
        contrato.setAvaliadoPor(null);
        contrato.setAvaliadoEm(null);
        contrato.setEnviadoEm(LocalDateTime.now());
        return ContratoDTO.de(contratoRepository.save(contrato));
    }

    public ContratoDTO aprovar(String emailAdmin, Integer id) {
        UserModel admin = usuarioLogado.exigirPerfil(emailAdmin, Perfis.ADMIN, "Apenas administradores podem aprovar contratos.");
        ContratoModel contrato = buscarEntidade(id);
        exigirAguardandoAprovacao(contrato);
        contrato.setStatus(StatusContrato.APROVADO);
        contrato.setAvaliadoPor(admin);
        contrato.setAvaliadoEm(LocalDateTime.now());
        return ContratoDTO.de(contratoRepository.save(contrato));
    }

    public ContratoDTO reprovar(String emailAdmin, Integer id, String motivo) {
        UserModel admin = usuarioLogado.exigirPerfil(emailAdmin, Perfis.ADMIN, "Apenas administradores podem reprovar contratos.");
        ContratoModel contrato = buscarEntidade(id);
        exigirAguardandoAprovacao(contrato);
        if (motivo == null || motivo.isBlank()) {
            throw NegocioException.invalido("Informe o motivo da reprovação para o corretor.");
        }
        contrato.setStatus(StatusContrato.REPROVADO);
        contrato.setMotivoReprovacao(motivo.trim());
        contrato.setAvaliadoPor(admin);
        contrato.setAvaliadoEm(LocalDateTime.now());
        return ContratoDTO.de(contratoRepository.save(contrato));
    }

    public ContratoDTO assinar(String emailCliente, Integer id, AssinaturaDTO dto) {
        UserModel cliente = usuarioLogado.buscar(emailCliente);
        ContratoModel contrato = buscarEntidade(id);
        if (!contrato.getCliente().getId().equals(cliente.getId())) {
            throw NegocioException.proibido("Apenas o cliente do contrato pode assiná-lo.");
        }
        if (contrato.getStatus() != StatusContrato.APROVADO) {
            throw NegocioException.conflito("O contrato precisa estar aprovado pelo administrador para ser assinado.");
        }
        if (dto == null || !Boolean.TRUE.equals(dto.aceite())) {
            throw NegocioException.invalido("É preciso aceitar os termos do contrato para assinar.");
        }
        if (dto.nomeAssinatura() == null || !normalizarNome(dto.nomeAssinatura()).equals(normalizarNome(cliente.getNome()))) {
            throw NegocioException.invalido("O nome digitado não confere com o nome cadastrado.");
        }

        LocalDateTime agora = LocalDateTime.now();
        contrato.setStatus(StatusContrato.ASSINADO);
        contrato.setAssinadoEm(agora);
        contrato.setAssinaturaNome(dto.nomeAssinatura().trim());
        contrato.setAssinaturaCodigo(gerarCodigo(contrato, cliente, agora));

        contrato.getImovel().setStatus(StatusImovel.finalizado(contrato.getImovel()));
        imovelRepository.save(contrato.getImovel());
        return ContratoDTO.de(contratoRepository.save(contrato));
    }

    // cada perfil enxerga apenas o que lhe diz respeito
    @Transactional(readOnly = true)
    public List<ContratoDTO> listar(String email) {
        UserModel usuario = usuarioLogado.buscar(email);
        List<ContratoModel> contratos = switch (Perfis.de(usuario)) {
            case Perfis.ADMIN -> contratoRepository.findAllByOrderByCriadoEmDesc();
            case Perfis.CORRETOR -> contratoRepository.findByCorretorIdOrderByCriadoEmDesc(usuario.getId());
            default -> contratoRepository.findByClienteIdOrderByCriadoEmDesc(usuario.getId());
        };
        return contratos.stream().map(ContratoDTO::de).toList();
    }

    @Transactional(readOnly = true)
    public ContratoDTO buscar(String email, Integer id) {
        UserModel usuario = usuarioLogado.buscar(email);
        ContratoModel contrato = buscarEntidade(id);
        String perfil = Perfis.de(usuario);
        boolean podeVer = Perfis.ADMIN.equals(perfil)
                || contrato.getCorretor().getId().equals(usuario.getId())
                || contrato.getCliente().getId().equals(usuario.getId());
        if (!podeVer) {
            throw NegocioException.proibido("Você não tem acesso a este contrato.");
        }
        return ContratoDTO.de(contrato);
    }

    private ContratoModel buscarEntidade(Integer id) {
        return contratoRepository.findById(id)
                .orElseThrow(() -> NegocioException.naoEncontrado("Contrato não encontrado."));
    }

    private void exigirAguardandoAprovacao(ContratoModel contrato) {
        if (contrato.getStatus() != StatusContrato.AGUARDANDO_APROVACAO) {
            throw NegocioException.conflito("Este contrato não está aguardando aprovação (status " + contrato.getStatus() + ").");
        }
    }

    private void validarDados(BigDecimal valor, String formaPagamento, String condicoes) {
        if (valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) {
            throw NegocioException.invalido("O valor do contrato deve ser maior que zero.");
        }
        if (formaPagamento == null || formaPagamento.isBlank()) {
            throw NegocioException.invalido("Informe a forma de pagamento.");
        }
        if (condicoes == null || condicoes.trim().length() < MIN_CONDICOES) {
            throw NegocioException.invalido("Descreva as condições do contrato (mínimo de " + MIN_CONDICOES + " caracteres).");
        }
    }

    // compara nomes ignorando maiúsculas, acentos e espaços extras
    static String normalizarNome(String nome) {
        if (nome == null) return "";
        String semAcento = Normalizer.normalize(nome, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return semAcento.trim().replaceAll("\\s+", " ").toLowerCase();
    }

    private String gerarCodigo(ContratoModel contrato, UserModel cliente, LocalDateTime quando) {
        String base = contrato.getId() + "|" + cliente.getEmail() + "|" + contrato.getValor() + "|" + quando;
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(base.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }
}
