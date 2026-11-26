/* =========================================
   PEDIDO: guarda o pedido finalizado e lê de volta
   Usado pelo checkout (que cria o pedido) e pela confirmação (que mostra).
   Depende de produtos.js (formatarPreco), carregado antes.

   Diferença importante para o carrinho:
   o carrinho guarda só { id, quantidade } e busca nome/preço no catálogo, porque o preço pode mudar.
   O pedido é uma FOTO do momento da compra: guarda o nome e o valor que a pessoa pagou.
   Assim, se o preço mudar amanhã, o pedido de hoje continua mostrando o valor certo.
========================================= */

const CHAVE_PEDIDO = 'celstore-pedido';

// Código guardado -> texto bonito para a tela.
const PAGAMENTOS = {
    pix: 'Pix',
    cartao: 'Cartão de crédito (até 12x sem juros)',
    boleto: 'Boleto bancário'
};

// Cria o número do pedido: "CEL-" + os 6 últimos dígitos da hora atual em milissegundos.
// Muda a cada milissegundo, então na prática nunca se repete. (Num site de verdade,
// quem cria o número é o servidor; aqui isso é uma simulação.)
function gerarNumeroPedido() {
    return 'CEL-' + String(Date.now()).slice(-6);
}

// Guarda o pedido. Devolve true se deu certo e false se o navegador não deixou.
function salvarPedido(pedido) {
    try {
        localStorage.setItem(CHAVE_PEDIDO, JSON.stringify(pedido));
        return true;
    } catch (erro) {
        return false;
    }
}

// Lê o pedido guardado. Devolve null se não existe ou se o conteúdo não tem a forma esperada
// (o localStorage pode estar vazio, estragado ou mexido por alguém no DevTools).
function lerPedido() {
    try {
        const texto = localStorage.getItem(CHAVE_PEDIDO);
        if (!texto) {
            return null;
        }
        const pedido = JSON.parse(texto);
        const valido = pedido &&
            typeof pedido.numero === 'string' &&
            Array.isArray(pedido.itens) && pedido.itens.length > 0 &&
            pedido.itens.every(item => item && typeof item === 'object') &&
            Number.isFinite(pedido.total) &&
            pedido.cliente && typeof pedido.cliente.nome === 'string' &&
            pedido.endereco && typeof pedido.endereco === 'object';
        return valido ? pedido : null;
    } catch (erro) {
        return null;
    }
}

// Converte o resumo do carrinho (calcularResumo) na lista de itens que vai dentro do pedido.
// map() cria uma lista nova, transformando cada linha: guardamos só o que precisamos mostrar depois.
function itensParaPedido(resumo) {
    return resumo.linhas.map(function (linha) {
        return {
            nome: linha.produto.nome,
            quantidade: linha.quantidade,
            subtotal: linha.subtotal
        };
    });
}

// Escreve o nome da forma de pagamento. Se o código for desconhecido, não quebra.
function nomeDoPagamento(codigo) {
    const nome = PAGAMENTOS[codigo];
    return typeof nome === 'string' ? nome : 'Não informado';
}

// Preenche a <ul> do resumo com uma linha por item.  itens: [{ nome, quantidade, subtotal }]
// Aqui montamos o HTML com createElement + textContent (em vez de innerHTML), porque no pedido
// vêm textos que passaram pelo localStorage. Esse caminho nunca interpreta o texto como HTML.
function desenharItensResumo(listaEl, itens) {
    listaEl.textContent = ''; // esvazia a lista antes de desenhar
    itens.forEach(function (item) {
        const li = document.createElement('li');

        const nome = document.createElement('span');
        nome.textContent = item.nome + ' (' + item.quantidade + ' un.)';

        const valor = document.createElement('span');
        valor.textContent = formatarPreco(Number(item.subtotal) || 0);

        li.append(nome, valor); // append aceita vários elementos de uma vez
        listaEl.appendChild(li);
    });
}
