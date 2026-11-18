package com.example.demo.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.models.TipoImovelModel;

public interface TipoImovelRepository extends JpaRepository<TipoImovelModel, Integer> {

    Optional<TipoImovelModel> findFirstByNome(String nome);
}
