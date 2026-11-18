package com.example.demo.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.DTOs.OfertaDTO;
import com.example.demo.DTOs.OfertaRequestDTO;
import com.example.demo.exceptions.NegocioException;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.models.Perfis;
import com.example.demo.models.StatusImovel;
import com.example.demo.models.StatusOferta;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.ContratoRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.OfertaRepository;

// Regras das ofertas:
// - só cliente (USER) envia; valor > 0; imóvel precisa estar disponível
// - um cliente não pode ter duas ofertas pendentes para o mesmo imóvel
// - só o próprio cliente cancela, e só enquanto está PENDENTE
// - corretor aceita/recusa apenas ofertas PENDENTES
// - ao aceitar: imóvel vai para EM_NEGOCIACAO e as outras pendentes do imóvel são recusadas
@Service
@Transactional
public class OfertaService {

    public static final int MAX_MENSAGEM = 1000;

    private final OfertaRepository ofertaRepository;
    private final ImovelRepository imovelRepository;
    private final ContratoRepository contratoRepository;
    private final UsuarioLogadoService usuarioLogado;

    public OfertaService(OfertaRepository ofertaRepository, ImovelRepository imovelRepository,
            ContratoRepository contratoRepository, UsuarioLogadoService usuarioLogado) {
        this.ofertaRepository = ofertaRepository;
        this.imovelRepository = imovelRepository;
        this.contratoRepository = contratoRepository;
        this.usuarioLogado = usuarioLogado;
    }

    public OfertaDTO criar(String emailCliente, OfertaRequestDTO dto) {
        UserModel cliente = usuarioLogado.exigirPerfil(emailCliente, Perfis.USER, "Apenas clientes podem enviar ofertas.");

        if (dto == null || dto.imovelId() == null) {
            throw NegocioException.invalido("Informe o imóvel da oferta.");
        }
        if (dto.valor() == null || dto.valor().compareTo(BigDecimal.ZERO) <= 0) {
            throw NegocioException.invalido("O valor da oferta deve ser maior que zero.");
        }
        String mensagem = dto.mensagem() == null ? null : dto.mensagem().trim();
        if (mensagem != null && mensagem.length() > MAX_MENSAGEM) {
            throw NegocioException.invalido("A mensagem pode ter no máximo " + MAX_MENSAGEM + " caracteres.");
        }

        ImovelModel imovel = imovelRepository.findById(dto.imovelId())
                .orElseThrow(() -> NegocioException.naoEncontrado("Imóvel não encontrado."));
        if (!StatusImovel.disponivel(imovel)) {
            throw NegocioException.conflito("Este imóvel não está disponível para ofertas.");
        }
        if (ofertaRepository.existsByClienteIdAndImovelIdAndStatus(cliente.getId(), imovel.getId(), StatusOferta.PENDENTE)) {
            throw NegocioException.conflito("Você já tem uma oferta pendente para este imóvel.");
        }

        OfertaModel oferta = new OfertaModel();
        oferta.setImovel(imovel);
        oferta.setCliente(cliente);
        oferta.setValor(dto.valor());
        oferta.setMensagem(mensagem == null || mensagem.isEmpty() ? null : mensagem);
        oferta.setStatus(StatusOferta.PENDENTE);
        oferta.setCriadaEm(LocalDateTime.now());
        return paraDTO(ofertaRepository.save(oferta));
    }

    @Transactional(readOnly = true)
    public List<OfertaDTO> listarDoCliente(String emailCliente) {
        UserModel cliente = usuarioLogado.buscar(emailCliente);
        return ofertaRepository.findByClienteIdOrderByCriadaEmDesc(cliente.getId()).stream().map(this::paraDTO).toList();
    }

    // usado pelo corretor e pelo admin; status opcional (ex.: PENDENTE)
    @Transactional(readOnly = true)
    public List<OfertaDTO> listar(String status) {
        List<OfertaModel> ofertas = status == null || status.isBlank()
                ? ofertaRepository.findAllByOrderByCriadaEmDesc()
                : ofertaRepository.findByStatusOrderByCriadaEmAsc(converterStatus(status));
        return ofertas.stream().map(this::paraDTO).toList();
    }

    public OfertaDTO cancelar(String emailCliente, Integer id) {
        UserModel cliente = usuarioLogado.buscar(emailCliente);
        OfertaModel oferta = buscar(id);
        if (!oferta.getCliente().getId().equals(cliente.getId())) {
            throw NegocioException.proibido("Você só pode cancelar as suas próprias ofertas.");
        }
        exigirPendente(oferta);
        oferta.setStatus(StatusOferta.CANCELADA);
        oferta.setRespondidaEm(LocalDateTime.now());
        return paraDTO(ofertaRepository.save(oferta));
    }

    public OfertaDTO aceitar(String emailCorretor, Integer id) {
        UserModel corretor = usuarioLogado.exigirPerfil(emailCorretor, Perfis.CORRETOR, "Apenas corretores podem aceitar ofertas.");
        OfertaModel oferta = buscar(id);
        exigirPendente(oferta);

        ImovelModel imovel = oferta.getImovel();
        if (!StatusImovel.disponivel(imovel)) {
            throw NegocioException.conflito("O imóvel já está em negociação ou foi finalizado.");
        }

        LocalDateTime agora = LocalDateTime.now();
        oferta.setStatus(StatusOferta.ACEITA);
        oferta.setCorretor(corretor);
        oferta.setRespondidaEm(agora);
        ofertaRepository.save(oferta);

        // as demais ofertas pendentes do mesmo imóvel são recusadas automaticamente
        for (OfertaModel outra : ofertaRepository.findByImovelIdAndStatus(imovel.getId(), StatusOferta.PENDENTE)) {
            outra.setStatus(StatusOferta.RECUSADA);
            outra.setCorretor(corretor);
            outra.setResposta("Outra oferta foi aceita para este imóvel.");
            outra.setRespondidaEm(agora);
            ofertaRepository.save(outra);
        }

        imovel.setStatus(StatusImovel.EM_NEGOCIACAO);
        imovelRepository.save(imovel);
        return paraDTO(oferta);
    }

    public OfertaDTO recusar(String emailCorretor, Integer id, String motivo) {
        UserModel corretor = usuarioLogado.exigirPerfil(emailCorretor, Perfis.CORRETOR, "Apenas corretores podem recusar ofertas.");
        OfertaModel oferta = buscar(id);
        exigirPendente(oferta);
        oferta.setStatus(StatusOferta.RECUSADA);
        oferta.setCorretor(corretor);
        oferta.setResposta(motivo == null || motivo.isBlank() ? null : motivo.trim());
        oferta.setRespondidaEm(LocalDateTime.now());
        return paraDTO(ofertaRepository.save(oferta));
    }

    OfertaModel buscar(Integer id) {
        return ofertaRepository.findById(id)
                .orElseThrow(() -> NegocioException.naoEncontrado("Oferta não encontrada."));
    }

    private void exigirPendente(OfertaModel oferta) {
        if (oferta.getStatus() != StatusOferta.PENDENTE) {
            throw NegocioException.conflito("Esta oferta já foi respondida (status " + oferta.getStatus() + ").");
        }
    }

    private StatusOferta converterStatus(String status) {
        try {
            return StatusOferta.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw NegocioException.invalido("Status de oferta inválido: " + status);
        }
    }

    private OfertaDTO paraDTO(OfertaModel oferta) {
        Integer contratoId = contratoRepository.findByOfertaId(oferta.getId()).map(c -> c.getId()).orElse(null);
        return OfertaDTO.de(oferta, contratoId);
    }
}
