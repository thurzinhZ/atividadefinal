package com.example.demo.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.models.UserModel;

public interface UserRepository extends JpaRepository<UserModel, Integer> {

    // usado no login e no filtro do JWT para achar o usuário pelo e-mail
    Optional<UserModel> findByEmail(String email);
}
