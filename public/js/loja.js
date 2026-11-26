/* =========================================
   LOJA: a parte que mexe na tela (roda em todas as páginas)
   Desde a Etapa 4, carrinho, contador e "Olá, Nome" vêm prontos do SERVIDOR.
   Aqui sobram três coisas:
   1) avisos de sucesso e de erro (com texto e ícone, não só cor), inclusive fechar o aviso do servidor;
   2) resposta ao formulário da newsletter (data-form-newsletter);
   3) escrever(), um utilitário para as páginas.
========================================= */

// ---------- 1) Avisos ----------

let avisoEl;       // caixa visível com a mensagem
let avisoTextoEl;  // o parágrafo dentro da caixa
let anuncioEl;     // região invisível que o leitor de tela "escuta"

// O JS também pode criar HTML. Criamos a caixa de aviso uma vez só, escondida.
// (Aqui o innerHTML só tem texto fixo escrito por nós; a mensagem entra depois com textContent.)
function criarAviso() {
    anuncioEl = document.createElement('div');
    anuncioEl.className = 'sr-only';
    anuncioEl.setAttribute('role', 'status'); // "status" = leitor de tela anuncia quando o texto mudar
    document.body.appendChild(anuncioEl);

    avisoEl = document.createElement('div');
    avisoEl.className = 'aviso';
    avisoEl.hidden = true;
    avisoEl.innerHTML =
        '<p class="aviso-texto"></p>' +
        '<button type="button" class="btn btn-link" data-aviso-fechar>Fechar</button>';
    document.body.appendChild(avisoEl);
    avisoTextoEl = avisoEl.querySelector('.aviso-texto');
}

// tipo: 'sucesso' ou 'erro'. O CSS usa o tipo pra escolher o ícone e as cores.
function mostrarAviso(texto, tipo) {
    fecharAvisos(); // um aviso de cada vez
    avisoEl.className = 'aviso aviso-' + tipo;
    avisoTextoEl.textContent = texto;
    avisoEl.hidden = false;
    anunciar(texto);
}

// Faz o leitor de tela falar um texto, sem mostrar nada na tela.
// Limpa e preenche de novo, assim ele anuncia até mensagens repetidas.
function anunciar(texto) {
    anuncioEl.textContent = '';
    setTimeout(function () {
        anuncioEl.textContent = texto;
    }, 50);
}

// Esconde qualquer aviso aberto: o nosso e o que veio pronto do servidor (data-aviso-servidor).
function fecharAvisos() {
    document.querySelectorAll('.aviso').forEach(function (aviso) {
        aviso.hidden = true;
    });
}

// O botão "Fechar" existe nos dois tipos de aviso. Um evento só, no documento inteiro, pega todos.
// A caixa não some sozinha: quem lê devagar não perde a mensagem.
function ligarFecharAvisos() {
    document.addEventListener('click', function (evento) {
        if (evento.target.closest('[data-aviso-fechar]')) {
            fecharAvisos();
        }
    });
    // A tecla Esc também fecha.
    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape') {
            fecharAvisos();
        }
    });
}

// ---------- 2) Newsletter ----------

// O botão "Assinar" confirma na tela. (O campo tem type="email" e required: o navegador barra e-mail mal escrito.)
function ligarNewsletter() {
    const formulario = document.querySelector('[data-form-newsletter]');
    if (!formulario) {
        return;
    }
    formulario.addEventListener('submit', function (evento) {
        evento.preventDefault();
        const email = formulario.querySelector('input[type="email"]').value.trim();
        formulario.reset();
        mostrarAviso('Obrigado! Enviaremos novidades e promoções para ' + email + '.', 'sucesso');
    });
}

// ---------- 3) Utilitário para as páginas ----------

// Escreve um texto dentro do elemento marcado com data-xxx. Usa textContent: entra como TEXTO, nunca como HTML.
function escrever(atributo, texto) {
    document.querySelector('[' + atributo + ']').textContent = texto;
}

// ---------- Início ----------
// Como o script tem "defer", o HTML já está pronto quando chegamos aqui.
criarAviso();
ligarFecharAvisos();
ligarNewsletter();
