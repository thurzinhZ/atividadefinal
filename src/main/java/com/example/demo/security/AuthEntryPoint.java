package com.example.demo.security;

import java.io.IOException;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// 401 Unauthorized: a rota exige autenticação e não recebeu o token,
// ou o token é inválido ou expirou.
// (sem essa classe o Spring devolve 403 quando não manda token)
@Component
public class AuthEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException) throws IOException {

        Object motivo = request.getAttribute(JwtAuthenticationFilter.JWT_ERRO);
        String mensagem = motivo != null ? motivo.toString() : "Token não informado";

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(
                "{\"status\": 401, \"erro\": \"Unauthorized\", \"mensagem\": \"" + mensagem + "\"}");
    }
}
