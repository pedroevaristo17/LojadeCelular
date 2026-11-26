---
description: Padrões das views EJS e dos partials do CelStore.
globs: views/**/*.ejs
alwaysApply: false
---

# Views EJS

- Reutilizar **partials**: `views/partials/navbar.ejs` e `footer.ejs` via `<%- include(...) %>`. O menu muda conforme a pessoa esteja logada ou não (`user` vem de `res.locals`).
- Passar ao `res.render(...)` apenas as **locals** necessárias (ex.: `produtos`, `erro`, `valores`, `pedido`) — evitar variáveis globais inventadas.
- Conteúdo gerado a partir do usuário (nome, e-mail, busca, endereço): usar o escape padrão do EJS (`<%= %>`); HTML confiável só com intenção explícita (`<%-`, com cuidado).
- Formulários: `method` e `action` corretos (`POST` para cadastro, login, carrinho e checkout); `name` dos campos alinhado ao `req.body` do servidor; ao errar, devolver os valores digitados (exceto senhas).
- Manter **HTML semântico** e classes compatíveis com `public/css/style.css` antes de criar CSS novo.
- Manter os estados de interface da AV2: erro (mensagem ligada ao campo), carregando, sucesso e vazio.
- Cada página tem um `<title>` próprio, um único `h1` e `<main id="conteudo">` com o link "Pular para o conteúdo".
