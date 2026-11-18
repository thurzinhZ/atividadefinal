package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.models.ContratoModel;

public interface ContratoRepository extends JpaRepository<ContratoModel, Integer> {

    List<ContratoModel> findAllByOrderByCriadoEmDesc();

    List<ContratoModel> findByClienteIdOrderByCriadoEmDesc(Integer clienteId);

    List<ContratoModel> findByCorretorIdOrderByCriadoEmDesc(Integer corretorId);

    Optional<ContratoModel> findByOfertaId(Integer ofertaId);

    boolean existsByOfertaId(Integer ofertaId);
}
