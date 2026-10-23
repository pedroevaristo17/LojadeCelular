/* =========================================
   PÁGINA DO PRODUTO: uma página só para todos os celulares
   Só é carregado em produto.html.
   Depende de produtos.js, carrinho.js e loja.js, carregados antes.

   O endereço diz qual celular mostrar:  produto.html?id=iphone-17
   Este arquivo lê o "id" do endereço, procura o produto em produtos.js e preenche a página.
   Se o id não existir, mostra o estado de erro "Produto não encontrado".
========================================= */

const conteudoEl = document.querySelector('[data-produto-conteudo]');
const erroEl = document.querySelector('[data-produto-erro]');

function desenhar() {
    // URLSearchParams lê a parte "?id=..." do endereço da página.
    const id = new URLSearchParams(window.location.search).get('id');
    const produto = id ? buscarProduto(id) : undefined;

    conteudoEl.hidden = !produto;
    erroEl.hidden = Boolean(produto);

    if (!produto) {
        document.title = 'Produto não encontrado | CelStore';
        return;
    }

    // O título da aba do navegador também muda: cada produto tem o seu.
    document.title = produto.nome + ' | CelStore';

    escrever('data-produto-migalha', produto.nome);
    escrever('data-produto-nome', produto.nome);
    escrever('data-produto-preco-antigo', formatarPreco(produto.precoAntigo));
    escrever('data-produto-preco', formatarPreco(produto.preco));
    escrever('data-produto-parcelas', 'Em até 12x de ' + formatarPreco(produto.preco / 12) + ' sem juros no cartão de crédito.');
    escrever('data-produto-garantia', GARANTIA + ' de garantia');

    // O formulário de compra precisa saber qual produto adicionar (o loja.js lê este valor ao enviar).
    document.querySelector('[data-form-compra]').dataset.produto = produto.id;

    // A imagem é criada aqui, com as medidas reais: o navegador já reserva o espaço certo antes de ela carregar.
    const img = document.createElement('img');
    img.src = produto.imagem;
    img.alt = produto.alt;
    img.width = produto.largura;
    img.height = produto.altura;
    document.querySelector('[data-produto-imagem]').replaceChildren(img);

    // Tabela de especificações: uma linha por item da "ficha", mais a garantia.
    const linhas = produto.ficha.concat([['Garantia', GARANTIA]]);
    const corpo = document.querySelector('[data-produto-ficha]');
    corpo.textContent = '';
    linhas.forEach(function (linha) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.scope = 'row'; // diz ao leitor de tela que esta célula é o título da LINHA
        th.textContent = linha[0];
        const td = document.createElement('td');
        td.textContent = linha[1];
        tr.append(th, td);
        corpo.appendChild(tr);
    });
}

// ---------- Início ----------
desenhar();
