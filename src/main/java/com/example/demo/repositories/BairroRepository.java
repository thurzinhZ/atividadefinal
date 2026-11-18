package com.example.demo.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.models.BairroModel;

public interface BairroRepository extends JpaRepository<BairroModel, Integer> {

    Optional<BairroModel> findFirstByNomeAndCidade(String nome, String cidade);
}
