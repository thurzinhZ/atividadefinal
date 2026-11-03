package com.example.demo.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.models.FotoImovelModel;
import com.example.demo.services.FotoImovelService;

@RestController
@RequestMapping("/fotos")
public class FotoImovelController {
    @Autowired
    private FotoImovelService service;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<FotoImovelModel> salvar(
            @RequestParam("arquivo") MultipartFile arquivo,
            @RequestParam("imovelId") Integer imovelId) {

        try {
            if (arquivo == null || arquivo.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            FotoImovelModel fotoImovelModel = service.salvar(arquivo, imovelId);
            return ResponseEntity.status(HttpStatus.CREATED).body(fotoImovelModel);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}