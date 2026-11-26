---
description: Convenções do servidor Express e das rotas do CelStore.
globs: index.js
alwaysApply: false
---

# Express (`index.js`)

- Ordem habitual: `express.urlencoded({ extended: true })` → `express.static('public')` → sessão (`express-session`) → variáveis das views (`res.locals`) → rotas → `listen`.
- **`db`:** conecte o `MongoClient` uma vez em `main()` e atribua `db = client.db(DB_NAME)` antes de registrar rotas que usam o banco. Crie os índices (`users.email` e `products.slug` únicos, `orders.numero` único, `orders.userId` + `createdAt`) na subida da aplicação.
- **Sessão:** `express-session` com `connect-mongo`; `cookie.httpOnly: true` e `sameSite: 'lax'`; o segredo vem de `SESSION_SECRET` (nunca fixo no código em produção).
- **Autenticação:** use um middleware `requireAuth` nas rotas que exigem login (checkout, pedidos, conta). Guarde na sessão só o necessário (`id`, `nome`, `email`), nunca o hash da senha.
- **Autorização:** ao buscar um pedido, sempre filtre pelo dono (`userId` da sessão) — nunca apenas pelo número que veio na URL.
- **Cadastro:** `insertOne` com `passwordHash` (bcrypt); trate o erro **11000** (e-mail duplicado).
- **Preços:** calcule itens e total no servidor a partir da coleção `products`; ignore qualquer preço enviado pelo navegador.
- **Erros:** `console.error` no servidor para falhas inesperadas; respostas ao cliente com mensagens claras, sem vazar stack. `ObjectId` inválido na URL deve virar 404, não derrubar o servidor.
- Se o `index.js` passar de ~400 linhas, perguntar antes de dividir em `routes/`.

Novas rotas POST que alteram dados: validar entrada no servidor sempre (nunca confiar só no HTML).
