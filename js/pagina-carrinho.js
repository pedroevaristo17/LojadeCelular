/* =========================================
   PÁGINA DO CARRINHO: desenha o carrinho na tela e trata os cliques
   Só é carregado em carrinho.html.
   Depende de produtos.js, carrinho.js e loja.js, carregados antes.

   Como funciona: o HTML tem só a "casca" (listas vazias). Este arquivo lê o carrinho
   guardado, desenha cada item e as contas, e redesenha quando a pessoa remove ou muda algo.
========================================= */

const conteudoEl = document.querySelector('[data-carrinho-conteudo]'); // lista + resumo
const vazioEl = document.querySelector('[data-carrinho-vazio]');       // tela de "carrinho vazio"
const listaEl = document.querySelector('[data-lista-carrinho]');       // <ul> onde os itens entram
const tituloItensEl = document.getElementById('titulo-itens');
const tituloVazioEl = document.getElementById('titulo-vazio');

// ---------- Desenhar ----------

// Monta o HTML de UM item do carrinho.
// Aqui usamos innerHTML porque os textos (nome, imagem...) vêm do nosso produtos.js.
// NUNCA faça isso com texto digitado por quem usa o site (nome, endereço...): alguém poderia
// escrever HTML ou JavaScript no campo. Para esse tipo de texto, use textContent.
function criarItemHTML(linha) {
    const p = linha.produto;
    return '<li class="item-carrinho">' +
        '<img src="' + p.imagem + '" alt="' + p.alt + '" width="' + p.largura + '" height="' + p.altura + '">' +
        '<div class="item-info">' +
            '<h3>' + p.nome + '</h3>' +
            '<p class="item-preco">' + formatarPreco(p.preco) + ' cada</p>' +
            '<div class="item-acoes">' +
                '<div class="campo campo-quantidade">' +
                    '<label for="qtd-' + p.id + '">Quantidade<span class="sr-only"> de ' + p.nome + '</span></label>' +
                    '<input type="number" id="qtd-' + p.id + '" name="qtd-' + p.id + '" value="' + linha.quantidade + '"' +
                        ' min="1" max="' + QUANTIDADE_MAXIMA + '" data-quantidade="' + p.id + '">' +
                '</div>' +
                '<button type="button" class="btn btn-link" data-remover="' + p.id + '">' +
                    'Remover<span class="sr-only"> ' + p.nome + ' do carrinho</span></button>' +
            '</div>' +
        '</div>' +
        '<p class="item-subtotal"><span class="sr-only">Subtotal: </span>' +
            '<span data-subtotal-item="' + p.id + '">' + formatarPreco(linha.subtotal) + '</span></p>' +
    '</li>';
}

// Escreve um texto dentro do elemento marcado com data-xxx (ex.: data-resumo-total).
function escrever(atributo, texto) {
    document.querySelector('[' + atributo + ']').textContent = texto;
}

// Atualiza SÓ os números: subtotal de cada item, total de itens, total e parcelas.
// Usamos isto quando a pessoa muda a quantidade. Não redesenhamos a lista inteira porque
// isso apagaria o campo em que ela está digitando (e o foco do teclado iria embora junto).
function atualizarTotais() {
    const resumo = calcularResumo();

    resumo.linhas.forEach(function (linha) {
        const alvo = listaEl.querySelector('[data-subtotal-item="' + linha.produto.id + '"]');
        if (alvo) {
            alvo.textContent = formatarPreco(linha.subtotal);
        }
    });

    const unidades = resumo.quantidadeTotal === 1 ? '1 item' : resumo.quantidadeTotal + ' itens';
    escrever('data-titulo-qtd', resumo.quantidadeTotal);
    escrever('data-resumo-rotulo', 'Subtotal (' + unidades + ')');
    escrever('data-resumo-subtotal', formatarPreco(resumo.total));
    escrever('data-resumo-total', formatarPreco(resumo.total));
    escrever('data-resumo-parcelas',
        'Ou em até 12x de ' + formatarPreco(resumo.total / 12) + ' sem juros no cartão de crédito.');
}

// Desenha a página inteira conforme o estado do carrinho: com itens ou vazio.
function desenhar() {
    const resumo = calcularResumo();
    const vazio = resumo.linhas.length === 0;

    conteudoEl.hidden = vazio;
    vazioEl.hidden = !vazio;

    if (!vazio) {
        // map() transforma cada linha em um pedaço de HTML; join('') cola tudo num texto só.
        listaEl.innerHTML = resumo.linhas.map(criarItemHTML).join('');
        atualizarTotais();
    }
}

// Depois de remover algo, o botão em que a pessoa clicou deixa de existir.
// Sem ajuda, o foco do teclado se perderia. Então levamos o foco para o título da seção.
// (tabindex="-1" no HTML permite receber foco pelo JS sem entrar na ordem do Tab.)
function moverFoco() {
    const alvo = calcularResumo().linhas.length === 0 ? tituloVazioEl : tituloItensEl;
    alvo.focus();
}

// ---------- Remover e desfazer ----------

function removerItem(id) {
    const produto = buscarProduto(id);
    // Pegamos a linha do resumo (e não o item cru do localStorage) porque ela já vem com a quantidade tratada.
    const linha = calcularResumo().linhas.find(l => l.produto.id === id);
    if (!produto || !linha) {
        return;
    }
    const quantidadeAnterior = linha.quantidade; // guardada para o "Desfazer"

    if (!removerDoCarrinho(id)) {
        mostrarAviso('Não foi possível remover o item. Verifique se o navegador permite armazenamento e tente de novo.', 'erro');
        return;
    }

    desenhar();
    atualizarContador();
    moverFoco();

    // Apagar sem volta é arriscado (e se foi um clique sem querer?). Por isso oferecemos "Desfazer".
    mostrarAviso(produto.nome + ' removido do carrinho.', 'sucesso', {
        rotulo: 'Desfazer',
        aoClicar: function () {
            adicionarAoCarrinho(id, quantidadeAnterior);
            desenhar();
            atualizarContador();
            moverFoco();
        }
    });
}

// ---------- Mudar a quantidade ----------

function mudarQuantidade(campo) {
    const id = campo.dataset.quantidade;
    const produto = buscarProduto(id);
    const resultado = alterarQuantidade(id, campo.value);

    if (!resultado.ok) {
        desenhar(); // volta a mostrar o que realmente está guardado
        mostrarAviso('Não foi possível alterar a quantidade. Verifique se o navegador permite armazenamento e tente de novo.', 'erro');
        return;
    }

    campo.value = resultado.quantidade; // mostra o valor já corrigido, se foi preciso corrigir
    atualizarTotais();
    atualizarContador();

    if (resultado.ajuste === 'maximo') {
        mostrarAviso('Limite de ' + QUANTIDADE_MAXIMA + ' unidades de ' + produto.nome + ' por pedido. A quantidade foi ajustada para ' + QUANTIDADE_MAXIMA + '.', 'erro');
    } else if (resultado.ajuste === 'minimo') {
        mostrarAviso('A quantidade mínima é 1. Para tirar ' + produto.nome + ' do carrinho, use o botão Remover.', 'erro');
    }
}

// ---------- Ligar os eventos ----------

// Os itens são apagados e desenhados de novo, então os botões e campos dentro deles "morrem"
// junto. Em vez de ligar um evento em cada um, ligamos UM evento na lista (que não é apagada).
// O clique "sobe" dos elementos de dentro até a lista, e aqui descobrimos quem foi clicado.
listaEl.addEventListener('click', function (evento) {
    // closest() procura o botão subindo a partir do ponto clicado.
    // Precisa disso porque o clique pode cair no texto escondido dentro do botão.
    const botao = evento.target.closest('[data-remover]');
    if (botao) {
        removerItem(botao.dataset.remover);
    }
});

// "change" dispara quando a pessoa termina de editar o campo (sai dele, aperta Enter ou usa as setinhas).
listaEl.addEventListener('change', function (evento) {
    const campo = evento.target.closest('[data-quantidade]');
    if (campo) {
        mudarQuantidade(campo);
    }
});

// ---------- Início ----------
desenhar();

// Voltou para esta página pelo botão "Voltar" do navegador, ou o carrinho mudou em outra aba:
// redesenha para não mostrar dados velhos.
window.addEventListener('pageshow', desenhar);
window.addEventListener('storage', desenhar);
