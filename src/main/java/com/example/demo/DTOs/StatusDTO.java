package com.example.demo.DTOs;

import lombok.Getter;
import lombok.Setter;

// corpo da requisição de alterar status: { "status": "VENDIDO" }
@Getter
@Setter
public class StatusDTO {
    private String status;
}
