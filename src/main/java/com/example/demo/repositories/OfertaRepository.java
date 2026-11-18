package com.example.demo.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.models.OfertaModel;
import com.example.demo.models.StatusOferta;

public interface OfertaRepository extends JpaRepository<OfertaModel, Integer> {

    List<OfertaModel> findByClienteIdOrderByCriadaEmDesc(Integer clienteId);

    List<OfertaModel> findByStatusOrderByCriadaEmAsc(StatusOferta status);

    List<OfertaModel> findAllByOrderByCriadaEmDesc();

    List<OfertaModel> findByImovelIdAndStatus(Integer imovelId, StatusOferta status);

    boolean existsByClienteIdAndImovelIdAndStatus(Integer clienteId, Integer imovelId, StatusOferta status);
}
