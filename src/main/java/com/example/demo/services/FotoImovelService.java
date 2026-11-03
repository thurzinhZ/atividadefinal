package com.example.demo.services;


import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.models.FotoImovelModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.repositories.FotoImovelRepository;
import com.example.demo.repositories.ImovelRepository;


@Service
public class FotoImovelService {
    @Autowired
    private FotoImovelRepository fotoImovelRepository;

    @Autowired
    private ImovelRepository imovelRepository;

    @Value("${app.upload-dir}")
    private String uploadDir;

    public FotoImovelModel salvar(MultipartFile arquivo, Integer imovelId) {
        ImovelModel imovel = imovelRepository.findById(imovelId)
            .orElseThrow(() -> new RuntimeException("Imóvel não encontrado"));

        try {
            if (arquivo == null || arquivo.isEmpty()) {
                throw new IllegalArgumentException("Arquivo de foto é obrigatório");
            }

            Path pasta = Paths.get(uploadDir, String.valueOf(imovelId));
            Files.createDirectories(pasta);

            String nomeOriginal = StringUtils.cleanPath(arquivo.getOriginalFilename());
            if (nomeOriginal == null || nomeOriginal.isBlank()) {
                throw new IllegalArgumentException("Nome do arquivo é obrigatório");
            }

            String nomeFinal = UUID.randomUUID() + "_" + nomeOriginal;
            Path destino = pasta.resolve(nomeFinal);
            arquivo.transferTo(destino);

            FotoImovelModel model = new FotoImovelModel();
            model.setCaminho(destino.toString());
            model.setNomeArquivo(nomeFinal);
            model.setImovel(imovel);

            return fotoImovelRepository.save(model);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar a foto do imóvel", e);
        }
    }
}
