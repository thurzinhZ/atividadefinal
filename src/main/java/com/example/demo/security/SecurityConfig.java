package com.example.demo.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final UserRepository userRepository;

    public SecurityConfig(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter,
            AuthEntryPoint authEntryPoint, AcessoNegadoHandler acessoNegadoHandler) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // página de login (HTML) -> pública
                .requestMatchers(HttpMethod.GET, "/", "/login.html").permitAll()
                // Login -> todos, sem token
                .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                // Listar imóveis / um imóvel -> todos, sem token
                .requestMatchers(HttpMethod.GET, "/imoveis", "/imoveis/**").permitAll()
                // Alterar status de imóvel -> qualquer usuário autenticado
                .requestMatchers(HttpMethod.PATCH, "/imoveis/*/status").authenticated()
                // Cadastrar, alterar e remover imóveis -> só ADMIN
                .requestMatchers(HttpMethod.POST, "/imoveis/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/imoveis/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/imoveis/**").hasRole("ADMIN")
                // Cadastrar e gerenciar usuários -> só ADMIN
                .requestMatchers("/auth/register", "/users", "/users/**").hasRole("ADMIN")
                // rotas que já eram públicas no projeto
                .requestMatchers(HttpMethod.GET, "/email/**").permitAll()
                // página de erro do Spring (senão um 404/500 viraria 401)
                .requestMatchers("/error").permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authEntryPoint)     // 401
                .accessDeniedHandler(acessoNegadoHandler)     // 403
            )
            .authenticationProvider(authenticationProvider(userDetailsService()))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            UserModel user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

            String role = user.getTipo() == null ? "USER" : user.getTipo();
            if (!role.startsWith("ROLE_")) {
                role = "ROLE_" + role;
            }

            return User.withUsername(user.getEmail())
                    .password(user.getSenha())
                    .roles(role.replace("ROLE_", ""))
                    .build();
        };
    }

    @Bean
    public AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
