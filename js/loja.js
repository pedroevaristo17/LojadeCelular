/* =========================================
   LOJA: a parte que mexe na tela (roda em todas as páginas)
   Depende de produtos.js e carrinho.js, carregados antes.
   Faz três coisas:
   1) mantém o número do carrinho no menu atualizado;
   2) mostra avisos de sucesso e de erro (com texto e ícone, não só cor);
   3) liga os botões "Adicionar ao carrinho" (os que têm data-adicionar).
========================================= */

// ---------- 1) Contador no menu ----------

// Escreve o total de itens ao lado do link "Carrinho". Com 0 itens, esconde.
function atualizarContador() {
    const total = totalDeItens();
    document.querySelectorAll('[data-contador]').forEach(function (contador) {
        contador.hidden = total === 0;
        // O texto escondido (sr-only) faz o leitor de tela falar "2 itens no carrinho",
        // em vez de só "2".
        contador.innerHTML = total + '<span class="sr-only"> ' +
            (total === 1 ? 'item' : 'itens') + ' no carrinho</span>';
    });
}

// ---------- 2) Avisos ----------

let avisoEl;       // caixa visível com a mensagem
let avisoTextoEl;  // o parágrafo dentro da caixa
let anuncioEl;     // região invisível que o leitor de tela "escuta"

// O JS também pode criar HTML. Criamos a caixa de aviso uma vez só, escondida.
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
        '<a href="carrinho.html" class="btn">Ver carrinho</a>' +
        '<button type="button" class="btn btn-link">Fechar</button>';
    document.body.appendChild(avisoEl);

    avisoTextoEl = avisoEl.querySelector('.aviso-texto');
    avisoEl.querySelector('button').addEventListener('click', fecharAviso);

    // A tecla Esc também fecha (a caixa não some sozinha: quem lê devagar não perde a mensagem).
    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape') {
            fecharAviso();
        }
    });
}

// tipo: 'sucesso' ou 'erro'. O CSS usa o tipo pra escolher o ícone e as cores.
function mostrarAviso(texto, tipo) {
    avisoEl.className = 'aviso aviso-' + tipo;
    avisoTextoEl.textContent = texto;
    avisoEl.hidden = false;

    // Limpa e preenche de novo, assim o leitor de tela anuncia até mensagens repetidas.
    anuncioEl.textContent = '';
    setTimeout(function () {
        anuncioEl.textContent = texto;
    }, 50);
}

function fecharAviso() {
    avisoEl.hidden = true;
}

// ---------- 3) Botões "Adicionar ao carrinho" ----------

// No HTML, cada botão tem data-adicionar="id-do-produto".
// No JS, esse valor aparece em botao.dataset.adicionar.
function ligarBotoesAdicionar() {
    document.querySelectorAll('[data-adicionar]').forEach(function (botao) {
        botao.addEventListener('click', function () {
            const id = botao.dataset.adicionar;
            const produto = buscarProduto(id);
            if (!produto) {
                mostrarAviso('Produto não encontrado.', 'erro');
                return;
            }

            const resultado = adicionarAoCarrinho(id, 1);

            if (resultado.ok) {
                atualizarContador();
                const unidades = resultado.quantidade > 1 ? ' (' + resultado.quantidade + ' unidades)' : '';
                mostrarAviso(produto.nome + ' adicionado ao carrinho' + unidades + '.', 'sucesso');
            } else if (resultado.motivo === 'limite') {
                mostrarAviso('Limite de ' + QUANTIDADE_MAXIMA + ' unidades de ' + produto.nome + ' por pedido.', 'erro');
            } else {
                mostrarAviso('Não foi possível adicionar ao carrinho. Verifique se o navegador permite armazenamento e tente de novo.', 'erro');
            }
        });
    });
}

// ---------- Início ----------
// Como o script tem "defer", o HTML já está pronto quando chegamos aqui.
criarAviso();
atualizarContador();
ligarBotoesAdicionar();

// Se a pessoa voltar pra esta página com o botão "Voltar" do navegador (a página pode vir
// de uma cópia guardada), ou mudar o carrinho em outra aba, o contador se atualiza.
window.addEventListener('pageshow', atualizarContador);
window.addEventListener('storage', atualizarContador);
