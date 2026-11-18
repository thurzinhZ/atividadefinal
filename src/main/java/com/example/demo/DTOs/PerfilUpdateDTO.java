package com.example.demo.DTOs;

// corpo do PUT /perfil. Para trocar a senha é preciso informar a senha atual.
public record PerfilUpdateDTO(String nome, String senhaAtual, String novaSenha) {
}
