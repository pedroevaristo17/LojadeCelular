---
description: Modelo de dados do CelStore no MongoDB (coleções, campos e cuidados). Use ao criar ou alterar consultas e gravações.
globs: index.js
alwaysApply: false
---

# Dados no MongoDB

Banco `MONGODB_DB` (padrão `celstore`), acessado com o driver nativo `mongodb`.

## Coleções

- **`users`:** `{ nome, email, passwordHash, createdAt }`. O e-mail é guardado em minúsculas e tem **índice único**.
- **`products`:** `{ slug, nome, preco, precoAntigo, imagem, especificacoes, ... }`. O `slug` (ex.: `galaxy-s26`) é o identificador usado nas URLs e tem **índice único**. É populada na primeira subida do servidor, quando a coleção está vazia (seed).
- **`orders`:** `{ numero, userId, itens: [{ slug, nome, preco, quantidade }], total, pagamento, endereco, createdAt }`. O `numero` é único; `userId` é o `ObjectId` do dono. O nome e o preço dos itens são copiados no momento da compra, para o histórico não mudar se o catálogo mudar.

- **`sessions`:** criada e mantida pelo `connect-mongo` (sessões de quem está logado). O código não grava nela diretamente.

## Cuidados

- Nunca guardar nem registrar em log a senha em texto puro.
- Converter ids vindos da URL com `new ObjectId(...)` dentro de `try/catch`; id inválido vira 404.
- Filtrar pedidos sempre por `userId` da sessão.
- Valores monetários: usar números inteiros ou o mesmo formato já usado no catálogo, de forma consistente; formatar como moeda (`R$ 1.234`) só na hora de mostrar.
- Mudar a estrutura de uma coleção exige perguntar antes e atualizar o PRD e esta regra.
