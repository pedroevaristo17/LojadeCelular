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
        return Array.isArray(itens) ? itens : [];
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
//   { ok: true, quantidade: 3 }               -> deu certo, agora tem 3 desse produto
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

    const novaQuantidade = Math.min(quantidadeAtual + quantidade, QUANTIDADE_MAXIMA);

    if (item) {
        item.quantidade = novaQuantidade;
    } else {
        itens.push({ id: id, quantidade: novaQuantidade });
    }

    if (!salvarCarrinho(itens)) {
        return { ok: false, motivo: 'armazenamento' };
    }
    return { ok: true, quantidade: novaQuantidade };
}

// Soma a quantidade de todos os itens (2 celulares de um tipo + 1 de outro = 3).
function totalDeItens() {
    let total = 0;
    for (const item of lerCarrinho()) {
        total += Number(item.quantidade) || 0; // "|| 0" protege contra valores estranhos
    }
    return total;
}
