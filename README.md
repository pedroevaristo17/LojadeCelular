# CelStore 📱

Projeto acadêmico de front-end para o desenvolvimento de uma loja virtual de smartphones, com foco especial em **acessibilidade web** seguindo as diretrizes WCAG 2, nível AA.

## 🎯 Critérios Atendidos

- **Estruturação:** HTML5 semântico
- **Layout:** CSS Grid e Flexbox
- **Acessibilidade e IHC:** conformidade com as diretrizes WCAG (Web Content Accessibility Guidelines)

## 👥 Desenvolvimento

- **HTML:** estruturação semântica e formulários
- **CSS:** estilização, layout e versionamento

## 💻 Como Executar Localmente

1. Clone o repositório para a sua máquina.
2. Certifique-se de que a pasta `img`, com todos os assets visuais, está no mesmo nível dos arquivos HTML.
3. Dê um duplo clique no arquivo `index.html` para abrir diretamente no seu navegador padrão.

---

## ♿ Acessibilidade (WCAG 2, nível AA)

A WCAG se apoia em quatro princípios, conhecidos pelo acrônimo **POUR**: um site precisa ser **P**erceptível, **O**perável, **U** (Compreensível, na sigla em português) e **R**obusto. Abaixo, cada critério trabalhado neste projeto está explicado em linguagem simples, seguido do trecho de código onde ele foi aplicado.

### 👁️ Perceptível — o conteúdo pode ser percebido por todos

**Estrutura semântica em vez de `div` para tudo.**
Tags como `<header>`, `<nav>`, `<main>` e `<footer>` funcionam como um mapa da página para quem usa leitor de tela — ele consegue pular direto para o menu ou para o conteúdo principal, em vez de navegar item por item.
📍 Presente em todas as páginas, ex.: [index.html:26](index.html:26) (`<html lang="pt-BR">`) e [index.html:36-59](index.html:36) (marcos semânticos do cabeçalho).

**Hierarquia de títulos sem "pular degrau".**
Cada página tem um único `<h1>`, e os subtítulos seguem em ordem (`h2` → `h3`) sem saltos. Isso permite que quem usa leitor de tela navegue pelo conteúdo como um índice.
📍 [index.html:60-166](index.html:60): `h1` (título da loja) → `h2` (Destaques, Ofertas, Vantagens) → `h3` (cada produto ou vantagem).

**Toda imagem tem texto alternativo.**
Fotos de produto descrevem o que aparece nelas; ícones puramente decorativos usam `alt=""` para não gerar ruído no leitor de tela.
📍 Foto de produto: [index.html:72](index.html:72). Ícone decorativo: [index.html:153](index.html:153).

**Erros nunca dependem só de cor.**
A área de mensagem de erro combina um ícone (⚠️) com texto explicativo, para que quem não distingue vermelho de outras cores também entenda o problema.
📍 [style.css:235-238](style.css:235).

**Contraste de texto garantido.**
A paleta de cores foi escolhida para manter contraste mínimo de 4,5:1 em texto normal e 3:1 em texto grande, facilitando a leitura para quem tem baixa visão.
📍 [style.css:1-14](style.css:1).

**Layout que aguenta zoom de até 200%.**
Em vez de pixels fixos, o CSS usa `rem`/`em`/`%`, então a página continua legível e organizada mesmo quando o usuário aumenta bastante o zoom do navegador.
📍 Uso consistente em todo o [style.css](style.css), ex.: [style.css:133](style.css:133).

### ⌨️ Operável — dá para usar tudo pelo teclado

**Nada de clique em `div`.**
Todo botão e link usa elementos nativos (`<button>`, `<a href>`), que já vêm com foco e ativação por teclado prontos. Nenhum `tabindex` positivo foi usado — a ordem de navegação segue a ordem natural do HTML.
📍 [login.html:67](login.html:67), [index.html:79](index.html:79).

**Skip link — atalho para o conteúdo.**
O primeiro elemento da página é um link invisível até receber foco, que permite pular o menu repetitivo e ir direto ao conteúdo principal.
📍 [index.html:34](index.html:34) (HTML) e [style.css:53-69](style.css:53) (comportamento visual ao focar).

**O foco do teclado nunca desaparece.**
Em vez de remover o contorno de foco (`outline: none`) sem repor nada, o CSS usa `:focus-visible` para destacar com clareza qual elemento está selecionado — essencial para quem navega sem mouse.
📍 [style.css:40-47](style.css:40).

**Sem movimento forçado.**
Quem ativa "reduzir movimento" no sistema operacional recebe transições quase instantâneas em vez de animações que podem causar desconforto.
📍 [style.css:297-306](style.css:297).

### 🧠 Compreensível — textos e interações são claros e previsíveis

**Todo campo tem um rótulo de verdade.**
Cada `<input>` está ligado ao seu `<label>` pelo par `for`/`id`. Isso significa que clicar no texto do rótulo já foca o campo, e o leitor de tela sempre anuncia o que está sendo preenchido — o placeholder nunca faz esse papel sozinho.
📍 [login.html:52-53](login.html:52), [cadastro.html:55-107](cadastro.html:55).

**Dicas de preenchimento conectadas ao campo.**
Textos de ajuda (como o formato esperado do CPF) são associados ao input via `aria-describedby`, para que o leitor de tela leia a dica junto com o rótulo.
📍 Senha: [login.html:58](login.html:58). CPF e telefone: [cadastro.html:61](cadastro.html:61) e [cadastro.html:72](cadastro.html:72).

**Campos relacionados agrupados.**
O formulário de cadastro usa `<fieldset>` + `<legend>` para separar visualmente e semanticamente "Dados pessoais", "Dados de acesso" e "Preferências".
📍 [cadastro.html:51-108](cadastro.html:51).

### 🤖 Robusto — funciona bem com tecnologias assistivas

**ARIA usado com moderação, não por padrão.**
A primeira regra do ARIA é: não usar ARIA quando uma tag nativa já resolve. Por isso ele aparece só onde agrega algo real — identificando cada `<nav>` (`aria-label`), marcando o link da página atual (`aria-current`) e sinalizando a área de erros como uma região que deve ser anunciada (`role="alert"`).
📍 `nav` com `aria-label`: [index.html:41](index.html:41). Página atual: [index.html:43](index.html:43). Erros: [login.html:49](login.html:49).

**Texto extra só para quem usa leitor de tela.**
A classe `.sr-only` esconde visualmente um texto sem removê-lo da árvore de acessibilidade — diferente de `display: none`, que apaga o conteúdo para todo mundo. É assim que o rótulo do campo de busca e a diferenciação entre botões "Adicionar ao carrinho" de produtos diferentes ficam claros só para quem precisa.
📍 Rótulo da busca: [index.html:53](index.html:53). Diferenciação de produtos: [index.html:79-80](index.html:79). Implementação CSS: [style.css:72-82](style.css:72).

---

## 🎓 Referência

Conteúdo baseado no material da disciplina *"Acessibilidade Web com HTML + CSS (WCAG 2 AA)"* (Profª Esp. Tacy Batista), que também contextualiza a obrigatoriedade legal: a Lei Brasileira de Inclusão (**Lei 13.146/2015**) exige que sites sejam acessíveis — não é uma opção técnica, é uma exigência legal.
