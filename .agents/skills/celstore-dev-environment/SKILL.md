---
name: celstore-dev-environment
description: Subir e validar o ambiente local do CelStore (Node, MongoDB em Docker ou Atlas, .env). Use ao rodar o projeto, depurar conexão com o banco ou orientar o setup de desenvolvimento.
---

# Ambiente de desenvolvimento — CelStore

## Pré-requisitos

- Node.js LTS recente (`node -v`)
- Docker Desktop (para o MongoDB local) **ou** um cluster gratuito do MongoDB Atlas

## Passos

1. Na raiz do repositório: `npm install`
2. Copiar `.env.example` para `.env` (no Windows: `copy .env.example .env`) e ajustar `MONGODB_URI`, `MONGODB_DB` e `SESSION_SECRET`.
3. Subir o banco: `docker compose up -d` (confira com `docker compose ps`).
4. Subir o servidor:
   - `npm run dev` — recarrega sozinho (nodemon)
   - ou `npm start`
5. Abrir `http://localhost:3000`

## MongoDB

- Shell do banco: `docker compose exec mongo mongosh celstore` (use o mesmo nome definido em `MONGODB_DB`).
- Ver os usuários: `db.users.find()`; ver os pedidos: `db.orders.find()`.
- Os dados ficam no volume `mongo_data`; `docker compose down` não apaga. Para apagar tudo: `docker compose down -v` (**só com autorização**).
- **Sem Docker:** crie um cluster gratuito no MongoDB Atlas, libere o seu IP e coloque a string de conexão em `MONGODB_URI`. O código não muda.

## Falhas comuns

- **"Falha ao iniciar" / erro de conexão:** o MongoDB não está rodando (`docker compose ps`) ou `MONGODB_URI` está errada no `.env`.
- **Docker Desktop não inicia no Windows:** conferir se a virtualização está ativada na BIOS e se o WSL 2 está instalado; se não resolver rápido, usar o Atlas.
- **Porta 3000 ou 27017 em uso:** fechar o outro programa (ou outro container) que usa a porta.
- **Sessão "some" ao reiniciar:** conferir se `SESSION_SECRET` e `MONGODB_URI` não mudaram entre as execuções.

## Documentação de produto

- O escopo funcional está em `docs/prd/` (complementa o README na raiz).
