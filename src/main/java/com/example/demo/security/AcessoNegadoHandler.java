package com.example.demo.security;

import java.io.IOException;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// 403 Forbidden: o token é válido, mas o usuário não tem permissão
// (ex.: USER tentando cadastrar imóvel)
@Component
public class AcessoNegadoHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException {

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(
                "{\"status\": 403, \"erro\": \"Forbidden\", \"mensagem\": \"Você não tem permissão para acessar este recurso\"}");
    }
}
