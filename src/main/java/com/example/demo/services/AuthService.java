package com.example.demo.services;

import java.util.Optional;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.DTOs.AuthResponseDTO;
import com.example.demo.DTOs.LoginRequestDTO;
import com.example.demo.DTOs.UserDTO;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;
import com.example.demo.security.JwtService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponseDTO register(UserDTO dto) {
        Optional<UserModel> existingUser = userRepository.findByEmail(dto.getEmail());
        if (existingUser.isPresent()) {
            throw new IllegalArgumentException("E-mail já cadastrado");
        }

        UserModel user = new UserModel();
        user.setNome(dto.getNome());
        user.setEmail(dto.getEmail());
        user.setTipo(dto.getTipo() != null ? dto.getTipo() : "USER");
        user.setSenha(passwordEncoder.encode(dto.getSenha()));

        userRepository.save(user);
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getSenha())
                .roles(user.getTipo().replace("ROLE_", ""))
                .build();

        String token = jwtService.generateToken(userDetails);
        return new AuthResponseDTO(token, user.getTipo(), user.getEmail());
    }

    public AuthResponseDTO login(LoginRequestDTO loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getSenha())
        );

        UserModel user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        String token = jwtService.generateToken((UserDetails) authentication.getPrincipal());
        return new AuthResponseDTO(token, user.getTipo(), user.getEmail());
    }
}
