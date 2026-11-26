# Roteiro da apresentação — CelStore

Como rodar o projeto: veja o [README](../README.md).

## 1. Antes do dia

- [ ] Confirmar com o professor: formato da entrega (link do GitHub, zip ou Teams), horário e se ele quer declaração de uso de IA.
- [ ] No notebook da apresentação (Pedro): `node -v` (20.19+), Docker Desktop abrindo (ou Atlas configurado), `git pull`, `npm install`, `.env` criado.
- [ ] Rodar o [checklist de teste](#4-checklist-de-teste-no-notebook-da-apresentação) completo.
- [ ] Criar os **dados de demonstração** (abaixo).

### Dados de demonstração

Criem pelo próprio site, antes de apresentar:

| Conta | Para que serve | O que fazer |
|-------|----------------|-------------|
| Conta A, ex.: `demo@exemplo.com` | Mostrar Minhas compras já com histórico | Cadastrar e fazer 1 ou 2 compras |
| Conta B, ex.: `outra@exemplo.com` | Provar que não vê as compras de A | Só cadastrar |

No CPF, usem um CPF de teste válido, como `529.982.247-25`. Para o cadastro feito ao vivo, usem um **terceiro e-mail**, ainda não cadastrado. Anotem as senhas fora do repositório.

### 10 minutos antes

1. Abrir o Docker Desktop e rodar `docker compose up -d`.
2. Rodar `npm run dev` e abrir <http://localhost:3000>.
3. Deixar abertos: o navegador (uma janela normal e uma **anônima**), o VS Code e um segundo terminal para o banco.
4. Aumentar o zoom do navegador e a fonte do terminal.
5. Anotar o número de um pedido da conta A (para o passo 7).
6. Sair da conta no navegador, para começar como visitante.

## 2. Roteiro

| # | Parte | Quem fala | O que mostrar |
|---|-------|-----------|---------------|
| 1 | Desenho cliente → servidor → banco | Vinícius | Diagrama |
| 2 | Cadastro e hash no banco | Pedro | Site e terminal |
| 3 | Login | Pedro | Site e DevTools |
| 4 | Busca | Vinícius | Site |
| 5 | Carrinho, checkout e confirmação | Pedro | Site e DevTools |
| 6 | Minhas compras | Pedro | Site e terminal |
| 7 | Segunda conta não vê as compras da primeira | Pedro | Janela anônima |
| 8 | Reiniciar o servidor | Pedro | Terminal |
| 9 | `AGENTS.md`, Rules e Skills | Vinícius | VS Code |
| 10 | Acessibilidade e design system | Vinícius | Teclado e `/design-system` |

### 1. Desenho: cliente → servidor → banco

```text
Navegador  --- GET /produto/iphone-17 --->  Express (index.js)  --- findOne --->  MongoDB
Navegador  <---------- HTML pronto -------  EJS (views/)        <--- produto ---  MongoDB
```

**Fala:** "O navegador pede um endereço, a rota busca no banco, o EJS monta o HTML e o servidor responde. Antes tudo ficava no navegador; agora fica no banco."

### 2. Cadastro e o hash

1. Em **Cadastro**, clicar em "Criar conta" vazio e mostrar os erros.
2. Cadastrar a conta nova.
3. No segundo terminal:

   ```bash
   docker compose exec mongo mongosh celstore --eval "db.users.find({}, { nome: 1, email: 1, passwordHash: 1 })"
   ```

4. Tentar o mesmo e-mail de novo: "Este e-mail já está cadastrado".

**Fala:** "Guardamos só o hash do bcrypt, que começa com `$2b$` e não tem volta. O índice único do banco impede e-mail repetido. O servidor valida tudo de novo, porque não confia no navegador."
**No código:** `app.post('/cadastro')` e `REGRAS_CADASTRO`.

### 3. Login

1. Errar a senha: "E-mail ou senha incorretos".
2. Entrar certo: o menu mostra "Olá, Nome".
3. DevTools (F12) → Application → Cookies: mostrar o `connect.sid` marcado como `HttpOnly`.

**Fala:** "A mensagem é genérica para não revelar se o e-mail existe. O cookie guarda só o número da sessão; quem está logado fica no banco. 'Lembrar de mim' faz o cookie durar 30 dias."
**No código:** `app.post('/login')` (`bcrypt.compare` e `regenerate`).

### 4. Busca

Buscar `iphone`, depois algo que não existe, e usar o botão **Voltar**.

**Fala:** "O termo vai no endereço (`?busca=`), o servidor filtra os produtos do banco e o Voltar funciona sozinho. Ignora acentos e maiúsculas."

### 5. Carrinho, checkout e confirmação

1. Sair da conta (botão **Sair**) para começar sem login.
2. Adicionar dois celulares; mudar a quantidade; remover e **Desfazer**.
3. Clicar em **Finalizar compra**: pede login. Entrar com a **conta A**: volta ao checkout com o carrinho cheio.
4. Mostrar os erros do formulário vazio.
5. **Tentar fraudar:** F12, clicar com o botão direito no formulário → "Editar como HTML" e acrescentar `<input type="hidden" name="total" value="1">`. Confirmar o pedido: o total continua o correto.
6. Recarregar a confirmação: não cria outro pedido.

**Fala:** "O navegador manda só o produto e a quantidade; preço e total vêm do banco. Depois do POST o servidor redireciona, por isso recarregar não repete a compra."
**No código:** `montarResumo` e `app.post('/checkout')`.

### 6. Minhas compras

Abrir **Olá, Nome**, expandir um pedido e mostrar no banco:

```bash
docker compose exec mongo mongosh celstore --eval "db.orders.find().sort({ createdAt: -1 }).limit(1)"
```

**Fala:** "Do mais novo para o mais antigo. O pedido guarda nome e preço do momento da compra: se o preço mudar, o histórico não muda."

### 7. Segunda conta

Na janela **anônima**, entrar com a conta B: Minhas compras está vazia. Digitar `/pedido/` seguido do número do pedido da conta A: "Pedido não encontrado".

**Fala:** "Isso é autorização: o servidor busca pelo número **e** pelo dono, que vem da sessão."
**No código:** `app.get('/pedido/:numero')`.

### 8. Reiniciar o servidor

No terminal do servidor: `Ctrl + C`, depois `npm run dev`. Recarregar a página: continua logado e os pedidos estão lá.

**Fala:** "Conta, sessão, carrinho e pedidos ficam no MongoDB, não na memória do servidor."

### 9. AGENTS.md, Rules e Skills

Abrir [AGENTS.md](../AGENTS.md), a pasta `.agents/` e o [PRD](prd/celstore-prd-2026-11-26.md).

**Fala:** "O PRD diz o que construir, o `AGENTS.md` diz o papel e os limites do agente, as Rules são padrões por assunto e as Skills são procedimentos, como o checklist de acessibilidade."

### 10. Acessibilidade e design system

1. Na home, apertar `Tab`: aparece "Pular para o conteúdo" e o foco fica sempre visível.
2. Zoom de 200%.
3. Abrir `/design-system`: cores com contraste, botões e estados de carregando, sucesso, erro e vazio.

## 3. Perguntas que podem surgir

| Pergunta | Resposta curta |
|----------|----------------|
| Por que hash e não criptografia? | Hash não tem volta: nem nós descobrimos a senha. |
| Por que validar no navegador **e** no servidor? | No navegador ajuda a pessoa; no servidor protege, porque o navegador pode ser alterado. |
| Diferença entre autenticação e autorização? | Autenticação é provar quem é; autorização é o que pode ver. |
| Por que `POST` e redirecionamento? | `POST` muda dados; redirecionar evita repetir a ação ao recarregar. |
| Funciona sem JavaScript? | Sim: busca, cadastro, login, carrinho e checkout são formulários comuns. |
| E o pagamento? | Está fora do escopo: só registramos a forma escolhida. |
| O que falta para um site real? | Pagamento, proteção CSRF por token, recuperação de senha, estoque, administração e HTTPS. |

## 4. Checklist de teste no notebook da apresentação

**Preparação**

- [ ] `git pull` e `npm install` sem erro
- [ ] `docker compose up -d` e `docker compose ps` mostrando o banco ligado
- [ ] `npm run dev` mostra "CelStore rodando em http://localhost:3000"

**Conta (Etapa 3)**

- [ ] Home mostra 6 celulares e a busca funciona
- [ ] Cadastro vazio mostra erros; cadastro correto mostra sucesso
- [ ] E-mail repetido mostra a mensagem
- [ ] No banco aparece `passwordHash` começando com `$2b$`, sem senha legível
- [ ] Senha errada não entra; certa mostra "Olá, Nome" em todas as páginas
- [ ] `/conta` sem login leva ao login; **Sair** funciona

**Compras (Etapa 4)**

- [ ] Carrinho continua cheio ao recarregar e depois do login
- [ ] Atualizar, remover e Desfazer funcionam; limite de 10 por produto
- [ ] Checkout sem login pede login e volta
- [ ] Campo `total` acrescentado no DevTools não muda o total
- [ ] Pedido aparece no banco; recarregar a confirmação não cria outro
- [ ] Minhas compras do mais novo para o mais antigo
- [ ] Conta B não vê o pedido da conta A, nem digitando o endereço
- [ ] Depois de reiniciar o servidor, login e pedidos continuam

## 5. Se algo der errado

| Situação | Saída |
|----------|-------|
| Docker não abre | Atlas: trocar `MONGODB_URI` no `.env`. Preparar antes e criar as contas de demonstração também no Atlas. |
| Porta 3000 ocupada | Fechar o outro terminal ou mudar `PORT` no `.env`. |
| Erro desconhecido | Consultar "Problemas comuns" no [README](../README.md). |
| Nada funciona | Mostrar capturas de tela feitas no ensaio e o código no VS Code. |
