# Aula 3 — Desenvolvimento e integração

## Banco de dados (XAMPP)

1. No painel do XAMPP, inicie o **MySQL** (e o Apache, se for usar o phpMyAdmin).
2. Abra http://localhost/phpmyadmin → **Importar** → escolha `database/imobiliaria.sql` → **Executar**.
   Isso cria o banco `imobiliaria` com todas as tabelas e dados de exemplo (pode importar de novo sem duplicar).
3. A aplicação conecta em `jdbc:mariadb://localhost:3306/imobiliaria` com `root` e senha vazia (padrão do XAMPP).
   Se o seu root tiver senha, defina a variável `DB_PASSWORD` ou edite `application.properties`.

Tabelas: `usuarios`, `tipos_imoveis`, `bairros`, `imoveis`, `fotos_imoveis` (do diagrama) e
`favoritos`, `ofertas`, `contratos` (Aula 3), todas ligadas por chaves estrangeiras.

## Como rodar

```bash
# backend (porta 8080)
./mvnw spring-boot:run

# frontend (porta 3000)
cd frontend
npm install
npm run dev
```

## Testes

```bash
./mvnw test              # regras de negócio (H2 em memória, perfil "test")
cd frontend && npm test  # regras do front + estados de carregamento/erro (Vitest)
```

## Perfis e contas de teste (senha `123`)

| Perfil | Conta | Área | O que faz |
|---|---|---|---|
| Cliente (`USER`) | user@email.com | `/area-cliente` | favorita imóveis, envia/cancela ofertas, assina contratos |
| Corretor (`CORRETOR`) | corretor@email.com | `/corretor` | aceita/recusa ofertas, prepara e revisa contratos |
| Administrador (`ADMIN`) | admin@email.com | `/painel` | aprova/reprova contratos, cadastra usuários, vê os indicadores |

Todos têm `/perfil` (alterar nome e senha). O nome do perfil é o que o cliente digita para assinar.

## Checkpoint: fluxo completo

1. **Cliente** abre um imóvel disponível e envia uma oferta → status `PENDENTE`.
2. **Corretor** aceita em "Ofertas pendentes" → oferta `ACEITA`, imóvel `EM_NEGOCIACAO`
   (as outras ofertas pendentes do imóvel são recusadas automaticamente).
3. **Corretor** prepara o contrato em "Minhas negociações" → `AGUARDANDO_APROVACAO`.
4. **Administrador** aprova em "Aprovação de contratos" → `APROVADO` (ou reprova com motivo →
   `REPROVADO`, e o corretor revisa e reenvia).
5. **Cliente** assina em "Contratos" (nome cadastrado + aceite) → `ASSINADO`, imóvel `VENDIDO`/`ALUGADO`
   e código de verificação SHA-256.

## Regras de negócio

- Só cliente envia oferta; valor > 0; imóvel precisa estar disponível; uma oferta pendente por cliente/imóvel.
- Só o próprio cliente cancela, e só enquanto está pendente.
- Corretor só responde ofertas pendentes.
- Contrato só para oferta aceita, só pelo corretor que aceitou, um por oferta; condições com 20+ caracteres.
- Admin só avalia contratos aguardando aprovação; reprovar exige motivo.
- Cliente só assina contrato aprovado e dele; o nome precisa conferir (ignora acentos/maiúsculas).
- Cada perfil só lista os contratos que lhe dizem respeito.

Violações retornam `{ status, erro, mensagem }` com 400 (dado inválido), 403 (não é seu),
404 (não existe) ou 409 (estado não permite).

## Endpoints novos

| Método e rota | Perfil |
|---|---|
| `GET /imoveis/busca?q&finalidade&tipoId&bairroId&precoMin&precoMax&dormitoriosMin&status&ordem&page&size` | público |
| `GET /tipos-imoveis`, `GET /bairros` (agora públicos, para os filtros) | público |
| `GET/PUT /perfil` | autenticado |
| `GET /favoritos`, `GET /favoritos/ids`, `POST/DELETE /favoritos/{imovelId}` | autenticado |
| `POST /ofertas`, `GET /ofertas/minhas`, `PATCH /ofertas/{id}/cancelar` | USER |
| `GET /ofertas?status=` | CORRETOR, ADMIN |
| `PATCH /ofertas/{id}/aceitar`, `PATCH /ofertas/{id}/recusar` | CORRETOR |
| `GET /contratos`, `GET /contratos/{id}` | autenticado (filtrado por perfil) |
| `POST /contratos`, `PUT /contratos/{id}` | CORRETOR |
| `PATCH /contratos/{id}/aprovar`, `PATCH /contratos/{id}/reprovar` | ADMIN |
| `PATCH /contratos/{id}/assinar` | USER |
| `GET /dashboard` (do perfil logado), `/dashboard/admin`, `/dashboard/corretor`, `/dashboard/cliente` | por perfil |

## Configuração

- `app.dados-demo=true` (application.properties) cadastra imóveis, bairros e tipos de exemplo sem
  duplicar. Coloque `false` para não inserir nada.
- `src/main/resources/db/mysql-schema.sql` roda a cada inicialização e só cria as tabelas que faltarem
  (mesma estrutura de `database/imobiliaria.sql`, sem os dados).
