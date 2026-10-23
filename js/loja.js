/* =========================================
   LOJA: a parte que mexe na tela (roda em todas as páginas)
   Depende de produtos.js e carrinho.js, carregados antes.
   Faz três coisas:
   1) mantém o número do carrinho no menu atualizado;
   2) mostra avisos de sucesso e de erro (com texto e ícone, não só cor);
   3) liga os botões "Adicionar ao carrinho" (data-adicionar) da home e o
      formulário da página do produto (data-form-compra).
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
let avisoVerCarrinhoEl; // link "Ver carrinho"
let avisoAcaoEl;   // botão extra opcional (por exemplo, "Desfazer")
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
        '<a href="carrinho.html" class="btn" data-aviso-ver>Ver carrinho</a>' +
        '<button type="button" class="btn" data-aviso-acao hidden></button>' +
        '<button type="button" class="btn btn-link" data-aviso-fechar>Fechar</button>';
    document.body.appendChild(avisoEl);

    avisoTextoEl = avisoEl.querySelector('.aviso-texto');
    avisoVerCarrinhoEl = avisoEl.querySelector('[data-aviso-ver]');
    avisoAcaoEl = avisoEl.querySelector('[data-aviso-acao]');
    avisoEl.querySelector('[data-aviso-fechar]').addEventListener('click', fecharAviso);

    // A tecla Esc também fecha (a caixa não some sozinha: quem lê devagar não perde a mensagem).
    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape') {
            fecharAviso();
        }
    });
}

// tipo: 'sucesso' ou 'erro'. O CSS usa o tipo pra escolher o ícone e as cores.
// acao (opcional): { rotulo: 'Desfazer', aoClicar: function () { ... } }
//   -> mostra um botão extra no aviso, no lugar do link "Ver carrinho".
function mostrarAviso(texto, tipo, acao) {
    avisoEl.className = 'aviso aviso-' + tipo;
    avisoTextoEl.textContent = texto;

    if (acao) {
        avisoAcaoEl.textContent = acao.rotulo;
        // "onclick =" troca o clique anterior pelo novo. Com addEventListener os cliques
        // iam se acumulando, e um aviso novo executaria também a ação do aviso antigo.
        avisoAcaoEl.onclick = function () {
            fecharAviso();
            acao.aoClicar();
        };
    }
    avisoAcaoEl.hidden = !acao;
    // Quem já está na página do carrinho não precisa do link para ela.
    avisoVerCarrinhoEl.hidden = Boolean(acao) || document.body.dataset.pagina === 'carrinho';

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

// ---------- 3) Adicionar ao carrinho ----------

// Adiciona e já mostra o aviso certo. Quem chama só precisa dizer o produto e a quantidade.
// Os botões da home e o formulário da página do produto usam esta mesma função.
function adicionarComAviso(id, quantidade) {
    const produto = buscarProduto(id);
    if (!produto) {
        mostrarAviso('Produto não encontrado.', 'erro');
        return;
    }

    const resultado = adicionarAoCarrinho(id, quantidade);

    if (resultado.ok) {
        atualizarContador();
        if (resultado.limitada) {
            // Deu para adicionar só uma parte: avisamos, em vez de deixar a pessoa achar que veio tudo.
            mostrarAviso('O limite é de ' + QUANTIDADE_MAXIMA + ' unidades de ' + produto.nome +
                ' por pedido. Seu carrinho ficou com ' + resultado.quantidade + '.', 'erro');
        } else {
            const unidades = resultado.quantidade > 1 ? ' (' + resultado.quantidade + ' unidades no carrinho)' : '';
            mostrarAviso(produto.nome + ' adicionado ao carrinho' + unidades + '.', 'sucesso');
        }
    } else if (resultado.motivo === 'limite') {
        mostrarAviso('Limite de ' + QUANTIDADE_MAXIMA + ' unidades de ' + produto.nome + ' por pedido.', 'erro');
    } else {
        mostrarAviso('Não foi possível adicionar ao carrinho. Verifique se o navegador permite armazenamento e tente de novo.', 'erro');
    }
}

// No HTML, cada botão tem data-adicionar="id-do-produto".
// No JS, esse valor aparece em botao.dataset.adicionar.
function ligarBotoesAdicionar() {
    document.querySelectorAll('[data-adicionar]').forEach(function (botao) {
        botao.addEventListener('click', function () {
            adicionarComAviso(botao.dataset.adicionar, 1);
        });
    });
}

// Formulário da página do produto: <form data-form-compra data-produto="galaxy-s26">.
// Aqui a quantidade vem do campo "Quantidade" que a pessoa preencheu.
function ligarFormulariosCompra() {
    document.querySelectorAll('[data-form-compra]').forEach(function (formulario) {
        formulario.addEventListener('submit', function (evento) {
            // Sem isto, o navegador recarregaria a página ao enviar o formulário.
            evento.preventDefault();
            const campo = formulario.querySelector('input[type="number"]');
            const quantidade = Math.floor(Number(campo.value)) || 1;
            adicionarComAviso(formulario.dataset.produto, quantidade);
        });
    });
}

// ---------- Início ----------
// Como o script tem "defer", o HTML já está pronto quando chegamos aqui.
criarAviso();
atualizarContador();
ligarBotoesAdicionar();
ligarFormulariosCompra();

// Se a pessoa voltar pra esta página com o botão "Voltar" do navegador (a página pode vir
// de uma cópia guardada), ou mudar o carrinho em outra aba, o contador se atualiza.
window.addEventListener('pageshow', atualizarContador);
window.addEventListener('storage', atualizarContador);
