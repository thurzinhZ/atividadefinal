-- Executado pelo Spring a cada inicialização (spring.sql.init.mode=always).
-- Só cria as tabelas que ainda não existem; não altera nem apaga dados.
-- A estrutura completa com dados de exemplo fica em database/imobiliaria.sql.

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
