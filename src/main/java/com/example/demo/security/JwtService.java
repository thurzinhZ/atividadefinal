package com.example.demo.security;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;

@Service
public class JwtService {

    private static final String ISSUER = "api-imobiliaria";

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    // Gera o token no login: sub = e-mail, roles = papel do usuário, exp = validade
    public String generateToken(UserDetails userDetails) {
        List<String> roles = userDetails.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .toList();

        return JWT.create()
                .withIssuer(ISSUER)
                .withSubject(userDetails.getUsername())
                .withClaim("roles", roles)
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + expiration))
                .sign(getAlgorithm());
    }

    // Confere assinatura, emissor e validade. Se o token for inválido ou estiver
    // expirado lança JWTVerificationException (TokenExpiredException quando expirou)
    public DecodedJWT validateToken(String token) throws JWTVerificationException {
        return JWT.require(getAlgorithm())
                .withIssuer(ISSUER)
                .build()
                .verify(token);
    }

    public String extractUsername(String token) {
        return validateToken(token).getSubject();
    }

    public List<String> extractRoles(String token) {
        List<String> roles = validateToken(token).getClaim("roles").asList(String.class);
        return roles != null ? roles : List.of();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            return extractUsername(token).equals(userDetails.getUsername());
        } catch (JWTVerificationException e) {
            return false;
        }
    }

    private Algorithm getAlgorithm() {
        return Algorithm.HMAC256(secret);
    }
}
