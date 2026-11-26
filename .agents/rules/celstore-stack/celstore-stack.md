---
description: Stack e objetivos do CelStore (Express, EJS, MongoDB). Use em qualquer mudança no repositório.
alwaysApply: true
---

# CelStore — contexto do projeto

- **Stack:** Node.js, **Express 5**, **EJS** (`views/`), **MongoDB** (driver nativo), **bcrypt** para senhas, **express-session** com **connect-mongo** para sessões e **dotenv** para configuração.
- **Escopo do produto:** requisitos e prioridades estão em `docs/prd/` (catálogo, cadastro, login, carrinho, checkout, Minhas compras). Em caso de dúvida sobre o que construir, o PRD manda.
- **Idioma da interface:** mensagens visíveis ao usuário em **português** (Brasil).
- **Dados:** banco `MONGODB_DB` (padrão `celstore`); coleções `users`, `products` e `orders`; variáveis `MONGODB_URI`, `MONGODB_DB` e `SESSION_SECRET` via `.env` (veja `.env.example`).
- **Estático:** CSS, JavaScript do navegador e imagens em `public/`. O design system (tokens, botões, formulários) já existe em `style.css` e deve ser reaproveitado, não reescrito.
- **Origem do projeto:** o CelStore nasceu como site estático (HTML, CSS e JS com `localStorage`). Ao migrar uma tela, preservar o comportamento e os estados que ela já tinha (carregando, sucesso, erro e vazio).

Não introduzir outro servidor de templates, ORM ou framework de front-end **salvo pedido explícito** — manter o padrão do material de aula.
