package com.example.demo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.example.demo.models.ImovelModel;

// JpaSpecificationExecutor permite montar a busca com filtros opcionais e paginação
public interface ImovelRepository extends JpaRepository<ImovelModel, Integer>, JpaSpecificationExecutor<ImovelModel> {

    boolean existsByTitulo(String titulo);
}
