# GEMINI.md

## Contexto do projeto
Aplicação web educacional para alunos do 3º período de Sistemas de Informação (CESMAC): o **CelStore**, uma loja de celulares fictícia. Node.js + Express para o servidor, EJS para as páginas e MongoDB para guardar usuários, produtos e pedidos. O escopo está descrito em `docs/prd/`.

## Padrões
- JavaScript puro (sintaxe CommonJS, com `require`).
- Express para rotas e servidor; sessão com `express-session` guardada no MongoDB (`connect-mongo`).
- EJS para renderizar as páginas no servidor; menu e rodapé em `views/partials/`.
- Senhas sempre com `bcrypt` (hash); configuração por variáveis de ambiente (`.env`, veja `.env.example`).
- Interface em português (Brasil) e acessibilidade WCAG 2.1 AA (veja `.agents/rules/`).

## Restrições
- Manter o código simples e acessível para estudantes; não complicar além do necessário.
- Não usar TypeScript nem frameworks de página única (React, Next.js etc.), e não adicionar ORM.
- Manter a separação: lógica do servidor (`index.js`), páginas (`views/`) e arquivos estáticos (`public/`).
- As demais instruções (papel, limites e comandos permitidos) estão em `AGENTS.md`.
