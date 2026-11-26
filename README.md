# CelStore 📱

Loja virtual **fictícia** de smartphones, feita como projeto acadêmico, com foco em **acessibilidade web** (WCAG, nível AA).

**CESMAC** - Sistemas de Informação, 3º período<br>
**Integrantes:** João Danilo, Pedro Evaristo e Vinícius Vianna

O projeto começou como um site estático (HTML, CSS e JavaScript) e agora é um sistema **fullstack**: dá para ver e buscar celulares, criar conta, entrar, montar o carrinho, finalizar a compra e consultar **Minhas compras**. Contas, produtos e pedidos ficam no banco de dados. Não há pagamento real.

## 🧱 Stack

| Camada | Tecnologia |
|--------|------------|
| Servidor | Node.js e Express 5 |
| Páginas | EJS (montadas no servidor), CSS e JavaScript puro |
| Banco de dados | MongoDB, com o driver nativo `mongodb` |
| Senhas | `bcrypt` (só o hash é guardado) |
| Sessão | `express-session` e `connect-mongo` |
| Configuração | `dotenv` (arquivo `.env`) |

---

## ✅ Pré-requisitos

1. [Node.js](https://nodejs.org/) **20.19 ou mais novo**. Confira com `node -v`.
2. [Git](https://git-scm.com/).
3. [Docker Desktop](https://www.docker.com/products/docker-desktop/) aberto. Se ele não funcionar no seu computador, use o [MongoDB Atlas](#-sem-docker-mongodb-atlas).

## 💻 Como rodar do zero

Abra o terminal (no VS Code: menu **Terminal → New Terminal**) e rode um comando de cada vez.

1. Baixe o projeto e entre na pasta:

   ```bash
   git clone https://github.com/pedroevaristo17/LojadeCelular.git
   cd LojadeCelular
   ```

   Se você já tem a pasta, entre nela e rode `git pull`.

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Crie o arquivo de configuração. **Faça isso uma vez só**: copiar de novo apaga o que você mudou.

   ```bash
   copy .env.example .env
   ```

   No Linux ou Mac: `cp .env.example .env`.

4. Abra o `.env` e troque o valor de `SESSION_SECRET` por um texto longo qualquer. Esse arquivo é secreto e **não vai para o GitHub**.

   | Variável | Para que serve | Valor padrão |
   |----------|----------------|--------------|
   | `MONGODB_URI` | Endereço do banco | `mongodb://127.0.0.1:27017` |
   | `MONGODB_DB` | Nome do banco | `celstore` |
   | `SESSION_SECRET` | Assina o cookie de sessão | troque |
   | `PORT` | Porta do site | `3000` |

5. Ligue o banco (com o Docker Desktop aberto):

   ```bash
   docker compose up -d
   ```

6. Ligue o servidor:

   ```bash
   npm run dev
   ```

   Deve aparecer `CelStore rodando em http://localhost:3000`. Na primeira vez aparece também `Carga inicial: 6 produtos gravados no banco.`

7. Abra no navegador: <http://localhost:3000>

**Para desligar:** `Ctrl + C` no terminal do servidor (se perguntar se deseja finalizar o arquivo em lotes, responda `S`) e `docker compose down` para desligar o banco. Os dados continuam guardados.

`npm start` liga o servidor sem recarregar sozinho. O `npm run dev` recarrega quando o código muda, mas **não** quando o `.env` muda.

### 🌐 Sem Docker: MongoDB Atlas

1. No site do [MongoDB Atlas](https://www.mongodb.com/atlas), crie um cluster gratuito (M0).
2. Crie um usuário do banco (senha só com letras e números) e libere o seu IP em **Network Access**.
3. Em **Connect → Drivers**, copie o endereço `mongodb+srv://...` para o `MONGODB_URI` do `.env`.
4. Pule o `docker compose up -d` e rode `npm run dev`.

Nunca coloque esse endereço no GitHub: ele contém a senha.

---

## 🗺️ Rotas

| Método e endereço | O que faz | Exige login |
|-------------------|-----------|:-----------:|
| `GET /` | Página inicial; busca com `/?busca=iphone` | Não |
| `GET /produto/:slug` | Detalhes de um celular, ex.: `/produto/iphone-17` | Não |
| `GET /cadastro` | Formulário de cadastro | Não |
| `POST /cadastro` | Valida e cria a conta | Não |
| `GET /login` | Formulário de login; aceita `?voltar=/checkout` | Não |
| `POST /login` | Confere a senha e abre a sessão | Não |
| `POST /sair` | Encerra a sessão | Não |
| `GET /conta` | Dados da pessoa e **Minhas compras** | Sim |
| `GET /carrinho` | Mostra o carrinho | Não |
| `POST /carrinho/adicionar` | Coloca um produto no carrinho (até 10 de cada) | Não |
| `POST /carrinho/atualizar` | Muda a quantidade | Não |
| `POST /carrinho/remover` | Tira um produto (com "Desfazer") | Não |
| `GET /checkout` | Entrega e pagamento | Sim |
| `POST /checkout` | Valida e grava o pedido | Sim |
| `GET /pedido/:numero` | Confirmação do pedido; **só o dono** vê | Sim |
| `GET /design-system` | Vitrine dos componentes visuais | Não |

Endereço que não existe mostra a página 404; erro inesperado mostra uma mensagem simples (500).

---

## 🗄️ Coleções do banco

| Coleção | O que guarda | Índices |
|---------|--------------|---------|
| `users` | `nome`, `email` (minúsculo), `passwordHash`, `createdAt` | `email` único |
| `products` | `slug`, `nome`, `preco`, `precoAntigo`, `imagem`, `especificacoes`, `ficha` e dados da imagem | `slug` único |
| `orders` | `numero` (CEL-xxxxxx), `userId`, `itens`, `total`, `pagamento`, `endereco`, `createdAt` | `numero` único; `userId` + `createdAt` |
| `sessions` | Quem está logado e o carrinho de cada visitante (criada pelo `connect-mongo`) | automáticos |

CPF, telefone e data de nascimento são validados no cadastro e **não são guardados**.

A coleção `products` é preenchida sozinha com a lista de `dados/produtos.js` quando está vazia.

### Como ver os dados

Com o Docker (o servidor pode continuar ligado):

```bash
docker compose exec mongo mongosh celstore --eval "db.users.find()"
docker compose exec mongo mongosh celstore --eval "db.orders.find()"
docker compose exec mongo mongosh celstore --eval "db.products.find({}, { slug: 1, preco: 1 })"
```

Para abrir o shell do banco: `docker compose exec mongo mongosh celstore` (saia com `exit`).
No Atlas, use o botão **Browse Collections**.

---

## 📁 Onde fica cada coisa

| Pasta / arquivo | O que tem |
|-----------------|-----------|
| `index.js` | O servidor: configuração, sessão, banco, validações e rotas |
| `views/` | As páginas, em EJS |
| `views/partials/` | Pedaços repetidos: `<head>`, menu, rodapé, aviso e erro de campo |
| `public/` | CSS, imagens e o JavaScript do navegador |
| `dados/produtos.js` | Carga inicial dos produtos |
| `docs/prd/` | Requisitos do produto |
| `docs/apresentacao.md` | Roteiro da apresentação e checklist de teste |
| `.agents/`, `AGENTS.md`, `GEMINI.md` | Instruções (Rules e Skills) para o agente de IA |

### Como o sistema funciona

```text
Navegador (cliente)  --- pedido HTTP --->  Express (index.js)  --- consulta --->  MongoDB
Navegador (cliente)  <--- HTML pronto ---  Express + EJS       <--- dados -----   MongoDB
```

Regra principal: **o servidor não confia no navegador.** Preços e totais vêm do banco, o dono do pedido vem da sessão e toda entrada é validada de novo no servidor.

---

## 🛠️ Problemas comuns

| Problema | O que fazer |
|----------|-------------|
| `Falha ao iniciar` ou `ECONNREFUSED 127.0.0.1:27017` | O banco está desligado: abra o Docker Desktop, rode `docker compose up -d` e confira com `docker compose ps`. Confira o `MONGODB_URI`. |
| `Falta o SESSION_SECRET` | Crie o `.env` (passos 3 e 4). |
| Docker Desktop não abre (erro de WSL ou virtualização) | Use o MongoDB Atlas. |
| Atlas: `bad auth` | Usuário ou senha errados no `MONGODB_URI`. |
| Atlas: `Server selection timed out` | Libere seu IP em **Network Access**. |
| `EADDRINUSE` na porta 3000 | Já há um servidor ligado: pare o outro com `Ctrl + C`. |
| PowerShell não deixa rodar o `npm` ("execução de scripts foi desabilitada") | Use `npm.cmd install` e `npm.cmd run dev`, ou o terminal **Command Prompt**. |
| Mudei o `.env` e nada mudou | Reinicie o servidor. |
| `Cannot find module` | Rode `npm install`. |
| Página sem estilo ou com `<%` na tela | Abra por `http://localhost:3000`, não pelo arquivo. |
| Todo mundo foi deslogado | Normal depois de trocar o `SESSION_SECRET`: entre de novo. |
| `git push` recusado | Rode `git pull` e tente de novo. Em caso de conflito, avise o grupo e não use `--force`. |
| Avisos de `vulnerabilities` ou `install-scripts` no `npm install` | Podem ser ignorados. **Não** rode `npm audit fix --force`. |

---

## ♿ Acessibilidade (WCAG, nível AA)

A WCAG se apoia em quatro princípios, o acrônimo **POUR**: um site precisa ser **P**erceptível, **O**perável, compreensível (**U**, de *understandable*) e **R**obusto. Abaixo, o que o projeto faz em cada um, com o lugar do código.

### 👁️ Perceptível

- **Estrutura semântica:** `<header>`, `<nav>`, `<main>` e `<footer>` funcionam como um mapa da página para o leitor de tela. 📍 [navbar.ejs](views/partials/navbar.ejs), [index.ejs](views/index.ejs#L15)
- **Títulos em ordem:** um único `<h1>` por página, depois `h2` e `h3`. 📍 [index.ejs](views/index.ejs#L16)
- **Texto alternativo:** fotos de produto são descritas; ícones decorativos usam `alt=""`. 📍 [foto](views/index.ejs#L37), [ícone](views/index.ejs#L69)
- **Erros não dependem só de cor:** ícone ⚠️ e texto. 📍 [style.css](public/css/style.css#L349)
- **Contraste:** cores com no mínimo 4,5:1 para texto comum. 📍 [tokens do CSS](public/css/style.css#L8)
- **Zoom de até 200%:** medidas em `rem`, `em` e `%`. 📍 [style.css](public/css/style.css)

### ⌨️ Operável

- **Elementos nativos:** `<button>` e `<a href>`, que já funcionam com o teclado. 📍 [index.ejs](views/index.ejs#L48)
- **Pular para o conteúdo:** primeiro link da página. 📍 [navbar.ejs](views/partials/navbar.ejs#L6), [style.css](public/css/style.css#L132)
- **Foco sempre visível** com `:focus-visible`. 📍 [style.css](public/css/style.css#L114)
- **Movimento reduzido** respeitado. 📍 [style.css](public/css/style.css#L441)
- **Alvos de toque** de pelo menos 44×44 px (token `--alvo-minimo`).

### 🧠 Compreensível

- **Rótulo visível** ligado a cada campo (`for`/`id`). 📍 [login.ejs](views/login.ejs#L23)
- **Dicas e erros ligados ao campo** com `aria-describedby`. 📍 [login.ejs](views/login.ejs#L29), [cadastro.ejs](views/cadastro.ejs)
- **Grupos de campos** com `<fieldset>` e `<legend>`. 📍 [cadastro.ejs](views/cadastro.ejs#L48)
- **Erro sem perder o preenchimento:** o servidor devolve o que foi digitado, menos as senhas.

### 🤖 Robusto

- **ARIA só quando agrega:** `aria-label` nas navegações, `aria-current` na página atual, `role="alert"` nos erros e `role="status"` nos avisos. 📍 [navbar.ejs](views/partials/navbar.ejs#L5), [login.ejs](views/login.ejs#L20), [aviso.ejs](views/partials/aviso.ejs)
- **Texto só para leitor de tela** (`.sr-only`), como o nome do produto em cada botão. 📍 [index.ejs](views/index.ejs#L48), [style.css](public/css/style.css#L151)
- **Funciona sem JavaScript:** busca, cadastro, login, carrinho e checkout são formulários HTML comuns.
