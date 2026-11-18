-- =============================================================================
-- Banco da imobiliária Casa Clara (XAMPP / MySQL ou MariaDB)
-- Como usar: phpMyAdmin > Importar > escolha este arquivo > Executar.
-- Cria o banco "imobiliaria", todas as tabelas e dados de exemplo.
-- Contas de teste (senha 123): admin@email.com, corretor@email.com, user@email.com
-- =============================================================================

CREATE DATABASE IF NOT EXISTS imobiliaria
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;
USE imobiliaria;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- usuarios: perfis USER (cliente), CORRETOR e ADMIN
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,              -- hash BCrypt (nunca a senha pura)
    tipo ENUM('USER', 'CORRETOR', 'ADMIN') NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- tipos_imoveis
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_imoveis (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- bairros
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bairros (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    cidade VARCHAR(255) NULL,
    estado VARCHAR(255) NULL,
    cep_inicial VARCHAR(255) NULL,
    cep_final VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- imoveis
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS imoveis (
    id INT NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NULL,
    preco_venda DECIMAL(15,2) NULL,
    preco_aluguel DECIMAL(15,2) NULL,
    finalidade ENUM('VENDA', 'ALUGUEL') NOT NULL DEFAULT 'VENDA',
    status ENUM('DISPONIVEL', 'EM_NEGOCIACAO', 'RESERVADO', 'VENDIDO', 'ALUGADO', 'INATIVO') NOT NULL DEFAULT 'DISPONIVEL',
    dormitorios INT NULL,
    banheiros INT NULL,
    garagem INT NULL,
    area_total DECIMAL(15,2) NULL,
    tipo_imovel_id INT NULL,
    area_construida DECIMAL(15,2) NULL,
    endereco VARCHAR(255) NULL,
    numero VARCHAR(255) NULL,
    complemento VARCHAR(255) NULL,
    cep VARCHAR(255) NULL,
    caracteristicas TEXT NULL,
    destaque BOOLEAN NOT NULL DEFAULT FALSE,
    bairro_id INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    usuario_id INT NULL,                      -- usuário que cadastrou o imóvel
    PRIMARY KEY (id),
    KEY idx_imoveis_finalidade_status (finalidade, status),
    CONSTRAINT fk_imoveis_tipo FOREIGN KEY (tipo_imovel_id) REFERENCES tipos_imoveis (id) ON DELETE SET NULL,
    CONSTRAINT fk_imoveis_bairro FOREIGN KEY (bairro_id) REFERENCES bairros (id) ON DELETE SET NULL,
    CONSTRAINT fk_imoveis_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- fotos_imoveis
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fotos_imoveis (
    id INT NOT NULL AUTO_INCREMENT,
    imovel_id INT NOT NULL,
    nome_arquivo VARCHAR(255) NULL,
    caminho VARCHAR(255) NULL,
    capa BOOLEAN NOT NULL DEFAULT FALSE,
    ordem INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_fotos_imovel FOREIGN KEY (imovel_id) REFERENCES imoveis (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Aula 3: favoritos, ofertas e contratos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favoritos (
    id INT NOT NULL AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    imovel_id INT NOT NULL,
    criado_em DATETIME(6) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_favorito_usuario_imovel (usuario_id, imovel_id),
    CONSTRAINT fk_favoritos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT fk_favoritos_imovel FOREIGN KEY (imovel_id) REFERENCES imoveis (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ofertas (
    id INT NOT NULL AUTO_INCREMENT,
    imovel_id INT NOT NULL,
    cliente_id INT NOT NULL,
    corretor_id INT NULL,                     -- quem aceitou/recusou
    valor DECIMAL(15,2) NOT NULL,
    mensagem TEXT NULL,
    resposta TEXT NULL,
    status ENUM('PENDENTE', 'ACEITA', 'RECUSADA', 'CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    criada_em DATETIME(6) NULL,
    respondida_em DATETIME(6) NULL,
    PRIMARY KEY (id),
    KEY idx_ofertas_imovel_status (imovel_id, status),
    KEY idx_ofertas_status (status),
    CONSTRAINT fk_ofertas_imovel FOREIGN KEY (imovel_id) REFERENCES imoveis (id),
    CONSTRAINT fk_ofertas_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios (id),
    CONSTRAINT fk_ofertas_corretor FOREIGN KEY (corretor_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contratos (
    id INT NOT NULL AUTO_INCREMENT,
    oferta_id INT NOT NULL,
    imovel_id INT NOT NULL,
    cliente_id INT NOT NULL,
    corretor_id INT NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    forma_pagamento VARCHAR(255) NULL,
    condicoes TEXT NULL,
    status ENUM('AGUARDANDO_APROVACAO', 'APROVADO', 'REPROVADO', 'ASSINADO') NOT NULL DEFAULT 'AGUARDANDO_APROVACAO',
    motivo_reprovacao TEXT NULL,
    avaliado_por_id INT NULL,                 -- administrador que aprovou/reprovou
    criado_em DATETIME(6) NULL,
    enviado_em DATETIME(6) NULL,
    avaliado_em DATETIME(6) NULL,
    assinado_em DATETIME(6) NULL,
    assinatura_nome VARCHAR(255) NULL,
    assinatura_codigo VARCHAR(64) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_contratos_oferta (oferta_id),
    KEY idx_contratos_status (status),
    CONSTRAINT fk_contratos_oferta FOREIGN KEY (oferta_id) REFERENCES ofertas (id),
    CONSTRAINT fk_contratos_imovel FOREIGN KEY (imovel_id) REFERENCES imoveis (id),
    CONSTRAINT fk_contratos_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios (id),
    CONSTRAINT fk_contratos_corretor FOREIGN KEY (corretor_id) REFERENCES usuarios (id),
    CONSTRAINT fk_contratos_avaliador FOREIGN KEY (avaliado_por_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Dados iniciais (INSERT IGNORE: importar de novo não duplica)
-- =============================================================================

-- senha "123" criptografada com BCrypt (o mesmo formato que o Spring Security usa)
INSERT IGNORE INTO usuarios (id, nome, email, senha, tipo) VALUES
    (1, 'Administrador', 'admin@email.com', '$2a$10$B5Wmy4F1JHh8CHVJ8VbGEelZ.8LvRMa8vikt.4NC5ELRsTqkpUw2K', 'ADMIN'),
    (2, 'Usuario', 'user@email.com', '$2a$10$B5Wmy4F1JHh8CHVJ8VbGEelZ.8LvRMa8vikt.4NC5ELRsTqkpUw2K', 'USER'),
    (3, 'Carla Corretora', 'corretor@email.com', '$2a$10$B5Wmy4F1JHh8CHVJ8VbGEelZ.8LvRMa8vikt.4NC5ELRsTqkpUw2K', 'CORRETOR');

INSERT IGNORE INTO tipos_imoveis (id, nome, descricao) VALUES
    (1, 'Casa', 'Casa térrea ou sobrado'),
    (2, 'Apartamento', 'Unidade em condomínio vertical'),
    (3, 'Terreno', 'Lote sem construção');

INSERT IGNORE INTO bairros (id, nome, cidade, estado, cep_inicial, cep_final) VALUES
    (1, 'Centro', 'Santa Maria', 'RS', '97010-000', '97015-999'),
    (2, 'Camobi', 'Santa Maria', 'RS', '97105-000', '97110-999'),
    (3, 'Nossa Senhora das Dores', 'Santa Maria', 'RS', '97050-000', '97050-999'),
    (4, 'Itararé', 'Santa Maria', 'RS', '97045-000', '97045-999');

INSERT IGNORE INTO imoveis
    (id, titulo, descricao, preco_venda, preco_aluguel, finalidade, status, dormitorios, banheiros, garagem,
     area_total, tipo_imovel_id, area_construida, endereco, numero, complemento, cep, caracteristicas, destaque, bairro_id, usuario_id)
VALUES
    (1, 'Casa 3 dormitórios', 'Casa ampla, pronta para morar.', 350000.00, NULL, 'VENDA', 'DISPONIVEL', 3, 2, 1,
     140.00, 1, 110.00, 'Rua das Flores', '100', NULL, '97105-100', 'Pátio, churrasqueira', FALSE, 2, 1),
    (2, 'Apartamento com sacada no Centro', 'Dois dormitórios, sala integrada e sacada com churrasqueira.', 289000.00, NULL, 'VENDA', 'DISPONIVEL', 2, 1, 1,
     68.00, 2, 68.00, 'Rua do Acampamento', '450', 'Apto 302', '97010-030', 'Sacada, elevador', TRUE, 1, 1),
    (3, 'Casa com pátio em Camobi', 'Casa térrea perto da universidade, com pátio amplo e garagem coberta.', 420000.00, NULL, 'VENDA', 'DISPONIVEL', 3, 2, 2,
     160.00, 1, 130.00, 'Rua Ernesto Beck', '1200', NULL, '97105-170', 'Pátio, garagem coberta', TRUE, 2, 1),
    (4, 'Studio mobiliado perto da UFSM', 'Ideal para estudantes: mobiliado, com internet inclusa.', NULL, 1350.00, 'ALUGUEL', 'DISPONIVEL', 1, 1, 0,
     32.00, 2, 32.00, 'Avenida Roraima', '800', 'Apto 12', '97105-900', 'Mobiliado, internet', FALSE, 2, 1),
    (5, 'Sobrado em Nossa Senhora das Dores', 'Sobrado com suíte, escritório e espaço gourmet.', 690000.00, NULL, 'VENDA', 'DISPONIVEL', 4, 3, 2,
     230.00, 1, 200.00, 'Rua Tuiuti', '2100', NULL, '97050-420', 'Suíte, espaço gourmet', TRUE, 3, 1),
    (6, 'Apartamento para alugar no Centro', 'Três dormitórios, próximo ao calçadão e a mercados.', NULL, 2400.00, 'ALUGUEL', 'DISPONIVEL', 3, 2, 1,
     98.00, 2, 98.00, 'Rua Venâncio Aires', '1500', 'Apto 501', '97010-002', 'Portaria 24h', FALSE, 1, 1),
    (7, 'Terreno plano em Camobi', 'Terreno de esquina, pronto para construir.', 160000.00, NULL, 'VENDA', 'DISPONIVEL', NULL, NULL, NULL,
     360.00, 3, NULL, 'Rua Mário Ruschel', 'S/N', NULL, '97105-200', 'Esquina, plano', FALSE, 2, 1),
    (8, 'Casa compacta no Itararé', 'Dois quartos, cozinha americana e pátio nos fundos.', NULL, 1600.00, 'ALUGUEL', 'DISPONIVEL', 2, 1, 1,
     70.00, 1, 60.00, 'Rua Itararé', '320', NULL, '97045-100', 'Pátio nos fundos', FALSE, 4, 1),
    (9, 'Cobertura duplex no Centro', 'Cobertura com terraço, vista para a cidade e duas vagas.', 980000.00, NULL, 'VENDA', 'DISPONIVEL', 3, 3, 2,
     180.00, 2, 180.00, 'Rua Dr. Bozano', '900', 'Cobertura', '97015-001', 'Terraço, vista', TRUE, 1, 1),
    (10, 'Apartamento térreo no Itararé', 'Térreo com pátio privativo, aceita pets.', 235000.00, NULL, 'VENDA', 'DISPONIVEL', 2, 1, 1,
     60.00, 2, 60.00, 'Rua Pinheiro Machado', '75', 'Apto 101', '97045-300', 'Aceita pets', FALSE, 4, 1);
