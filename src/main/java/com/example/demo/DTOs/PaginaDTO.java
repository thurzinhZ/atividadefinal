package com.example.demo.DTOs;

import java.util.List;

import org.springframework.data.domain.Page;

// Formato estável da resposta paginada (independe da versão do Spring Data)
public record PaginaDTO<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <T> PaginaDTO<T> de(Page<T> page) {
        return new PaginaDTO<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
