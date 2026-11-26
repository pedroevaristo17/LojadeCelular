# Documento de Requisitos de Produto (PRD) — CelStore

**Versão:** 1.0
**Data:** 26 de novembro de 2026
**Arquivo:** `docs/prd/celstore-prd-2026-11-26.md`
**Contexto:** Evolução do projeto CelStore (loja de celulares fictícia, CESMAC · Sistemas de Informação) de um site estático para um sistema fullstack: Node.js, Express, EJS e MongoDB.

---

## 1. Visão do produto

A CelStore é uma loja virtual de smartphones. Visitantes podem **ver o catálogo, buscar e abrir os detalhes de cada celular** e montar um **carrinho**. Para **finalizar a compra**, a pessoa precisa **ter uma conta e estar logada**. Depois da compra, ela vê a confirmação do pedido e pode consultar o histórico em **Minhas compras**.

Na versão estática (AV1 e AV2), tudo ficava guardado no navegador e o login era uma simulação. Nesta versão, **usuários, produtos e pedidos ficam no banco de dados**, a **senha é protegida** e as **contas e compras valem em qualquer computador**.

---

## 2. Objetivos

- Permitir cadastro e login de verdade (senha com hash, e-mail único, sessão no servidor).
- Servir o catálogo a partir do banco de dados.
- Permitir finalizar uma compra e guardar o pedido, ligado à conta de quem comprou.
- Mostrar a cada pessoa apenas as próprias compras.
- Manter tudo o que foi conquistado na AV2: telas navegáveis, estados de interface (carregando, sucesso, erro, vazio), acessibilidade WCAG e design system.

---

## 3. Escopo funcional

### 3.1 Catálogo e busca

| ID | Requisito | Prioridade |
|----|-----------|------------|
| CAT-01 | A página inicial lista os celulares em oferta (nome, imagem, preço antigo e novo, especificações), com dados vindos do banco. | Alta |
| CAT-02 | A busca filtra por nome e especificações; todas as palavras digitadas precisam aparecer; ignora acentos e maiúsculas. O termo fica no endereço (`?busca=`), então o botão "Voltar" do navegador funciona. | Alta |
| CAT-03 | Busca sem resultado mostra o estado "Nenhum celular encontrado" com botão para ver todos de novo. | Média |
| CAT-04 | A página de detalhes mostra as informações do produto; um endereço de produto que não existe mostra uma mensagem clara (404), não um erro técnico. | Alta |

**Critérios de aceitação:** o catálogo continua igual ao que a pessoa via antes; produto inexistente nunca derruba o servidor.

---

### 3.2 Cadastro

| ID | Requisito | Prioridade |
|----|-----------|------------|
| REG-01 | Formulário com nome, e-mail, senha e confirmação de senha. | Alta |
| REG-02 | Validação **no servidor**: campos obrigatórios, e-mail em formato válido, senha com no mínimo 6 caracteres, senhas iguais. As mensagens de erro aparecem no formulário, sem perder o que a pessoa digitou (exceto as senhas). | Alta |
| REG-03 | Senha guardada **apenas como hash (bcrypt)**, nunca em texto puro. | Alta |
| REG-04 | E-mail único (comparado em minúsculas); e-mail repetido mostra mensagem clara. | Alta |
| REG-05 | Sucesso: mensagem de confirmação e convite para entrar. | Média |

**Critérios de aceitação:** a pessoa consegue se cadastrar uma única vez por e-mail; não existe senha legível em lugar nenhum do banco.

---

### 3.3 Login e logout

| ID | Requisito | Prioridade |
|----|-----------|------------|
| AUTH-01 | Formulário com e-mail e senha (POST). | Alta |
| AUTH-02 | Campos obrigatórios; erro de credencial com mensagem genérica ("E-mail ou senha incorretos"), sem revelar se o e-mail existe. | Alta |
| AUTH-03 | Login correto cria uma sessão no servidor (cookie `httpOnly`) e leva a pessoa à área da conta, ou de volta à página que ela tentava acessar. | Alta |
| AUTH-04 | O menu muda conforme o estado: visitante vê "Login" e "Cadastro"; pessoa logada vê "Olá, Nome" e "Sair". | Alta |
| AUTH-05 | "Sair" encerra a sessão. | Média |

**Critérios de aceitação:** quem se cadastrou consegue entrar e continua logado entre as páginas até sair ou a sessão expirar; senha errada nunca entra.

---

### 3.4 Carrinho

| ID | Requisito | Prioridade |
|----|-----------|------------|
| CART-01 | Qualquer visitante (logado ou não) adiciona produtos ao carrinho, altera quantidades e remove itens. | Alta |
| CART-02 | O carrinho fica guardado na sessão do servidor; sobrevive à navegação, ao login e ao recarregamento da página. | Alta |
| CART-03 | O contador do menu mostra a quantidade de itens. | Média |
| CART-04 | Carrinho vazio mostra o estado vazio com link para ver os celulares. | Média |
| CART-05 | Os preços e o total são **sempre calculados no servidor** a partir do banco; o navegador só informa qual produto e quantas unidades. | Alta |

**Critérios de aceitação:** adulterar o formulário não altera preço nem total.

---

### 3.5 Checkout e pedido

| ID | Requisito | Prioridade |
|----|-----------|------------|
| CHK-01 | O checkout só é acessível para quem está logado; visitante é levado ao login e, depois de entrar, volta ao checkout. | Alta |
| CHK-02 | Formulário: nome completo, CEP, endereço, número, complemento (opcional), bairro, cidade, estado e forma de pagamento (Pix, cartão ou boleto). Validação **no servidor**; erros aparecem no formulário. | Alta |
| CHK-03 | Com carrinho vazio, o checkout mostra o estado vazio, sem criar pedido. | Alta |
| CHK-04 | Pedido válido é gravado no banco (itens com nome e preço no momento da compra, total, forma de pagamento, endereço, data e **dono**), o carrinho é esvaziado e a pessoa vai para a confirmação. | Alta |
| CHK-05 | A confirmação mostra o número do pedido, os itens, o total, a forma de pagamento e o endereço de entrega. Só o dono do pedido consegue abrir essa página. | Alta |
| CHK-06 | O botão de confirmar mostra o estado "Processando pedido…" e não permite envio duplicado. | Média |

**Critérios de aceitação:** compra feita aparece no banco e continua lá depois de reiniciar o servidor; dois cliques seguidos não geram dois pedidos.

---

### 3.6 Minha conta e Minhas compras

| ID | Requisito | Prioridade |
|----|-----------|------------|
| ACC-01 | Área da conta acessível apenas para quem está logado; visitante é levado ao login. | Alta |
| ACC-02 | Exibe nome e e-mail da pessoa e o botão "Sair". | Alta |
| ACC-03 | **Minhas compras:** lista, da mais nova para a mais antiga, as compras da própria pessoa (número, data, total); cada compra pode ser aberta para ver itens e forma de pagamento. | Alta |
| ACC-04 | Sem compras, mostra o estado vazio com link para a loja. | Média |

**Critérios de aceitação:** cada pessoa vê somente as próprias compras; uma pessoa não consegue abrir o pedido de outra, nem mudando o endereço da página.

---

## 4. Requisitos não funcionais

| Área | Descrição |
|------|-----------|
| Segurança | Senhas com bcrypt; cookie de sessão `httpOnly` e `sameSite`; segredo da sessão em variável de ambiente; toda entrada validada no servidor; dados do usuário escapados nas páginas (EJS `<%= %>`); segredos fora do git. Proteção CSRF por token é evolução futura. |
| Usabilidade | Mensagens em português; formulários com estados de erro e sucesso visíveis; estados de carregando, sucesso, erro e vazio mantidos como na AV2. |
| Acessibilidade | WCAG 2.1 AA: contraste mínimo 4,5:1, foco visível, navegação por teclado, labels visíveis, alvos de toque de pelo menos 44×44 px, hierarquia de títulos coerente. |
| Dados | MongoDB. Coleções: `users` (índice único em `email`), `products` (índice único em `slug`) e `orders` (índice em `userId` e `createdAt`, e índice único em `numero`). |
| Operação | O sistema sobe com `docker compose up -d` (banco) e `npm run dev` (servidor), ambos descritos no README. |
| Desempenho | Adequado para uso acadêmico. |

---

## 5. Fora do escopo (esta versão)

- Pagamento real (gateway de pagamento); a forma de pagamento é só registrada no pedido.
- Cálculo de frete e busca de endereço por CEP.
- Recuperação de senha por e-mail e envio de e-mails.
- Painel de administração, controle de estoque e cadastro de produtos pela interface.
- Avaliações, favoritos, cupons e comparação de produtos.
- Páginas institucionais do rodapé (Sobre, Contato, Política de privacidade).

---

## 6. Métricas de sucesso

- Fluxo completo: cadastro → login → buscar → adicionar ao carrinho → checkout → confirmação → Minhas compras funciona sem erros.
- Os dados continuam lá depois de reiniciar o servidor (conta, login e pedidos).
- Duas contas diferentes enxergam apenas as próprias compras.
- Qualquer integrante do grupo consegue rodar o projeto seguindo só o README.

---

## 7. Dependências e riscos

- **MongoDB** disponível em Docker (`docker-compose.yml`) ou, se o Docker não funcionar na máquina, em um cluster gratuito do MongoDB Atlas (só muda a variável `MONGODB_URI` do `.env`).
- **Node.js** em versão LTS recente e **Docker Desktop** instalados na máquina da apresentação.
- Portas **3000** (servidor) e **27017** (MongoDB) livres.
- O `.env` não vai para o git: cada máquina precisa criar o seu a partir do `.env.example`.
- Risco de prazo: priorizar o fluxo principal (cadastro, login, carrinho, checkout, Minhas compras) antes de qualquer melhoria extra.

---

## 8. Glossário

| Termo | Significado |
|-------|-------------|
| Autenticação | Provar quem você é (login). |
| Autorização | Decidir o que cada pessoa pode ver ou fazer (ex.: só o dono vê o próprio pedido). |
| Sessão | Memória do servidor sobre quem está logado; o navegador guarda só um cookie com o identificador. |
| Hash | Resultado de uma transformação sem volta; é o que guardamos no lugar da senha. |
| Template (EJS) | Página HTML com espaços que o servidor preenche com dados. |
| Pedido | Registro de uma compra finalizada, com itens, total, pagamento e endereço. |

---

*Documento alinhado ao repositório de exemplo CESMAC (Express, EJS e MongoDB), aplicado ao projeto CelStore.*
