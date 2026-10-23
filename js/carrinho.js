/* =========================================
   CARRINHO: guarda e lê os itens no localStorage
   Aqui não existe nada de tela. São só funções que mexem nos dados.
   (Este arquivo usa buscarProduto(), por isso produtos.js é carregado antes.)
========================================= */

// Nome da "gaveta" do localStorage onde o carrinho fica guardado.
const CHAVE_CARRINHO = 'celstore-carrinho';
const QUANTIDADE_MAXIMA = 10; // mesmo limite do campo de quantidade nas páginas

// O carrinho é uma lista de { id, quantidade }.
// Só guardamos o id e a quantidade. Nome, preço e foto vêm de produtos.js.
// Assim, se um preço mudar, o carrinho já mostra o valor novo.

// Lê o carrinho guardado. Se não tem nada (ou o conteúdo está estragado), devolve uma lista vazia.
function lerCarrinho() {
    try {
        const texto = localStorage.getItem(CHAVE_CARRINHO); // o localStorage só guarda TEXTO
        if (!texto) {
            return [];
        }
        const itens = JSON.parse(texto); // transforma o texto de volta em lista
        if (!Array.isArray(itens)) {
            return [];
        }
        // Qualquer pessoa pode abrir o DevTools e bagunçar o localStorage.
        // Então só aceitamos itens que tenham a forma esperada: um objeto com um "id" de texto.
        return itens.filter(item => item && typeof item.id === 'string');
    } catch (erro) {
        // JSON.parse falha se o texto estiver quebrado; localStorage pode estar bloqueado.
        return [];
    }
}

// Guarda o carrinho. Devolve true se deu certo e false se o navegador não deixou.
function salvarCarrinho(itens) {
    try {
        localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens)); // lista -> texto
        return true;
    } catch (erro) {
        return false;
    }
}

// Adiciona um produto ao carrinho.
// Devolve um objeto que conta o que aconteceu, e a tela decide a mensagem:
//   { ok: true, quantidade: 3, limitada: false } -> deu certo, agora tem 3 desse produto
//        (limitada: true quer dizer que pediram mais do que cabia e o JS parou no máximo)
//   { ok: false, motivo: 'limite' }           -> já tinha o máximo
//   { ok: false, motivo: 'produto-inexistente' } ou { ok: false, motivo: 'armazenamento' }
function adicionarAoCarrinho(id, quantidade = 1) {
    if (!buscarProduto(id)) {
        return { ok: false, motivo: 'produto-inexistente' };
    }

    const itens = lerCarrinho();
    const item = itens.find(i => i.id === id);
    const quantidadeAtual = item ? item.quantidade : 0;

    if (quantidadeAtual >= QUANTIDADE_MAXIMA) {
        return { ok: false, motivo: 'limite' };
    }

    const quantidadePedida = quantidadeAtual + quantidade;
    const novaQuantidade = Math.min(quantidadePedida, QUANTIDADE_MAXIMA);

    if (item) {
        item.quantidade = novaQuantidade;
    } else {
        itens.push({ id: id, quantidade: novaQuantidade });
    }

    if (!salvarCarrinho(itens)) {
        return { ok: false, motivo: 'armazenamento' };
    }
    return { ok: true, quantidade: novaQuantidade, limitada: quantidadePedida > novaQuantidade };
}

// Tira um produto do carrinho. Devolve true se deu certo.
// filter() cria uma lista nova só com os itens que passam no teste: aqui, todos menos o removido.
function removerDoCarrinho(id) {
    const itens = lerCarrinho().filter(item => item.id !== id);
    return salvarCarrinho(itens);
}

// Esvazia o carrinho (é o que acontece quando o pedido é finalizado). Devolve true se deu certo.
function limparCarrinho() {
    return salvarCarrinho([]);
}

// Troca a quantidade de um produto que já está no carrinho (a quantidade passa a ser exatamente esta).
// Corrige valores que não fazem sentido, em vez de recusar:
//   menos de 1 (ou algo que não é número) -> vira 1      mais que o máximo -> vira o máximo
// Devolve { ok: true, quantidade, ajuste } e "ajuste" é 'minimo', 'maximo' ou null (nada foi corrigido).
function alterarQuantidade(id, novaQuantidade) {
    const itens = lerCarrinho();
    const item = itens.find(i => i.id === id);
    if (!item) {
        return { ok: false, motivo: 'item-inexistente' };
    }

    let quantidade = Math.floor(Number(novaQuantidade)); // 2.7 -> 2   "abc" -> NaN
    let ajuste = null;

    if (!(quantidade >= 1)) {            // pega 0, negativos e NaN (NaN nunca é >= 1)
        quantidade = 1;
        ajuste = 'minimo';
    } else if (quantidade > QUANTIDADE_MAXIMA) {
        quantidade = QUANTIDADE_MAXIMA;
        ajuste = 'maximo';
    }

    item.quantidade = quantidade;
    if (!salvarCarrinho(itens)) {
        return { ok: false, motivo: 'armazenamento' };
    }
    return { ok: true, quantidade: quantidade, ajuste: ajuste };
}

// Junta o carrinho (id + quantidade) com os dados dos produtos e faz as contas.
// Devolve:
//   linhas:          lista de { produto, quantidade, subtotal }  (uma por tipo de celular)
//   quantidadeTotal: quantas unidades no total (2 de um + 1 de outro = 3)
//   total:           valor em reais
// O carrinho, o checkout e a confirmação vão usar esta mesma função.
// Assim a conta é feita em um lugar só e não pode dar números diferentes de uma tela pra outra.
function calcularResumo() {
    const linhas = [];
    let quantidadeTotal = 0;
    let total = 0;

    for (const item of lerCarrinho()) {
        const produto = buscarProduto(item.id);
        if (!produto) {
            continue; // id que não existe mais na loja: ignora
        }
        // Mesmo tratamento de "valor estranho": inteiro entre 1 e o máximo.
        const quantidade = Math.min(Math.max(parseInt(item.quantidade, 10) || 1, 1), QUANTIDADE_MAXIMA);
        const subtotal = produto.preco * quantidade;

        linhas.push({ produto: produto, quantidade: quantidade, subtotal: subtotal });
        quantidadeTotal += quantidade;
        total += subtotal;
    }

    return { linhas: linhas, quantidadeTotal: quantidadeTotal, total: total };
}

// Quantas unidades tem no carrinho (é o número que aparece no menu).
function totalDeItens() {
    return calcularResumo().quantidadeTotal;
}
