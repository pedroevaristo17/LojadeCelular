---
description: Ao editar o frontend (views EJS, CSS e JS públicos), aplicar WCAG 2.1 AA e o checklist da skill wcag-21-aa-testing.
globs: views/**/*.ejs,public/**/*
alwaysApply: false
---

# Frontend → acessibilidade (WCAG 2.1 AA)

Qualquer mudança em **`views/`** ou **`public/`** deve seguir a skill do projeto **`wcag-21-aa-testing`**: ler `.agents/skills/wcag-21-aa-testing/SKILL.md` e usar como checklist de trabalho — não como sugestão opcional.

## Pontos obrigatórios (resumo)

- **Contraste:** texto comum ≥ 4,5:1; texto grande ≥ 3:1 (**1.4.3**). Use as cores do design system (tokens `--cor-*` em `public/css/style.css`).
- **Teclado:** toda interação essencial só com Tab, Enter, Espaço e Escape; foco sempre visível (**2.1.1**, **2.4.7**).
- **Alvos de toque:** botões e links de ação com pelo menos **44×44 px** (token `--alvo-minimo`).
- **Imagens:** `alt` descritivo, ou vazio só quando for decorativa (**1.1.1**).
- **Formulários:** `label` visível ligado ao campo (`for`/`id`); erros ligados ao campo com `aria-describedby`; obrigatório indicado também por texto, não só por cor (**3.3.1**, **3.3.2**).
- **Estrutura:** um `h1` por página e níveis de título sem pular; `header`, `nav`, `main` e `footer` onde couber (**1.3.1**).
- **Layout:** telas críticas usáveis até 200% de zoom e em 390 px de largura, sem rolagem horizontal; respeitar `prefers-reduced-motion` em animações.
- **Avisos dinâmicos:** mensagens de sucesso e erro anunciadas para leitor de tela (`role="alert"` ou região de status).

Nova imagem, link, botão, formulário ou bloco principal de layout: revisar este resumo antes de concluir a tarefa ou o commit.
