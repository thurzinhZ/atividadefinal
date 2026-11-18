package com.example.demo.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.exceptions.NegocioException;
import com.example.demo.models.FavoritoModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.FavoritoRepository;
import com.example.demo.repositories.ImovelRepository;

// Favoritar é idempotente: favoritar duas vezes não duplica o registro
@Service
@Transactional
public class FavoritoService {

    private final FavoritoRepository favoritoRepository;
    private final ImovelRepository imovelRepository;
    private final UsuarioLogadoService usuarioLogado;

    public FavoritoService(FavoritoRepository favoritoRepository, ImovelRepository imovelRepository,
            UsuarioLogadoService usuarioLogado) {
        this.favoritoRepository = favoritoRepository;
        this.imovelRepository = imovelRepository;
        this.usuarioLogado = usuarioLogado;
    }

    @Transactional(readOnly = true)
    public List<ImovelModel> listar(String email) {
        UserModel usuario = usuarioLogado.buscar(email);
        return favoritoRepository.findByUsuarioIdOrderByCriadoEmDesc(usuario.getId()).stream()
                .map(FavoritoModel::getImovel)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Integer> listarIds(String email) {
        return listar(email).stream().map(ImovelModel::getId).toList();
    }

    // retorna true quando criou um favorito novo
    public boolean adicionar(String email, Integer imovelId) {
        UserModel usuario = usuarioLogado.buscar(email);
        ImovelModel imovel = imovelRepository.findById(imovelId)
                .orElseThrow(() -> NegocioException.naoEncontrado("Imóvel não encontrado."));
        if (favoritoRepository.findByUsuarioIdAndImovelId(usuario.getId(), imovel.getId()).isPresent()) {
            return false;
        }
        FavoritoModel favorito = new FavoritoModel();
        favorito.setUsuario(usuario);
        favorito.setImovel(imovel);
        favorito.setCriadoEm(LocalDateTime.now());
        favoritoRepository.save(favorito);
        return true;
    }

    public void remover(String email, Integer imovelId) {
        UserModel usuario = usuarioLogado.buscar(email);
        favoritoRepository.findByUsuarioIdAndImovelId(usuario.getId(), imovelId)
                .ifPresent(favoritoRepository::delete);
    }
}
