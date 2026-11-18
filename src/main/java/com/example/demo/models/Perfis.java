package com.example.demo.models;

import java.util.Set;

// Perfis de acesso do sistema. O valor fica gravado na coluna usuarios.tipo.
public final class Perfis {
    public static final String USER = "USER";           // cliente
    public static final String CORRETOR = "CORRETOR";
    public static final String ADMIN = "ADMIN";

    public static final Set<String> TODOS = Set.of(USER, CORRETOR, ADMIN);

    private Perfis() {
    }

    // aceita "ADMIN", "admin" ou "ROLE_ADMIN"
    public static String normalizar(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            return USER;
        }
        return tipo.trim().toUpperCase().replaceFirst("^ROLE_", "");
    }

    public static String de(UserModel usuario) {
        return normalizar(usuario.getTipo());
    }
}
