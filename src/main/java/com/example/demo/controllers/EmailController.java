package com.example.demo.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.services.EmailService;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;

@RestController
@RequestMapping("/email")
public class EmailController {

    @Autowired
    private EmailService service;

    @Value("${gemini.model:gemini-3.8-flash}")
    private String model;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @GetMapping
    public ResponseEntity<String> enviar() {
        try {
            service.enviarEmailTexto(
                    "destinatario@exemplo.com",
                    "Teste de email",
                    "Olá, este é um teste de envio de e-mail."
            );
            return ResponseEntity.ok("E-mail texto enviado");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/template")
    public ResponseEntity<String> enviarComTemplate() {
        try {
            service.enviarEmailComTemplate(
                    "destinatario@exemplo.com",
                    "Bem-vindo!",
                    "email/template",
                    Map.of(
                            "nome", "Maria",
                            "itens", List.of("Plano Pro", "Suporte 24h"),
                            "link", "https://meusite.com"
                    )
            );
            return ResponseEntity.ok("E-mail com template enviado");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/gemini")
    public ResponseEntity<String> enviarComGemini() {
        try {
            if (apiKey == null || apiKey.isBlank()) {
                return ResponseEntity.badRequest().body("Configure gemini.api.key no application.properties");
            }

            String prompt = """
                    Escreva um e-mail curto e cordial, em português, informando que
                    o imóvel está disponível para visita.
                    Responda apenas com o texto do e-mail, em texto puro, sem markdown e sem assunto.
                    """;

            Client client = Client.builder().apiKey(apiKey).build();
            GenerateContentResponse response = client.models.generateContent(model, prompt, null);
            String texto = response.text();

            service.enviarEmailTexto("destinatario@exemplo.com", "Teste Gemini", texto);

            return ResponseEntity.ok("E-mail gerado por Gemini enviado");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
