/* =========================================
   SERVIDOR DO CELSTORE
   Etapa 2: o servidor Express entrega as páginas (templates EJS). Ainda sem banco de dados.

   Como funciona (arquitetura cliente-servidor):
   1) o navegador (CLIENTE) pede um endereço, por exemplo GET /produto/iphone-17;
   2) o SERVIDOR (este arquivo) procura a ROTA que combina com esse endereço;
   3) a rota junta os dados e manda o EJS montar o HTML (res.render);
   4) o navegador recebe o HTML pronto e mostra a página.
   Arquivos que não mudam (CSS, imagens, JS do navegador) ficam em public/ e são entregues como estão.
========================================= */

// Lê o arquivo .env (se existir) e coloca as configurações em process.env.
// quiet: true -> não imprime dicas do dotenv no terminal.
require('dotenv').config({ quiet: true });

const path = require('path');
const express = require('express');
const { PRODUTOS, GARANTIA } = require('./dados/produtos');

const app = express();
const PORTA = Number(process.env.PORT) || 3000;

// ---------- Configuração ----------

app.set('view engine', 'ejs');                    // as páginas são templates EJS...
app.set('views', path.join(__dirname, 'views'));  // ...que ficam na pasta views/

app.use(express.urlencoded({ extended: true }));  // lê os dados dos formulários (POST) em req.body
app.use(express.static(path.join(__dirname, 'public'))); // entrega CSS, imagens e JS do navegador

// ---------- Funções que as páginas usam ----------

// Transforma um número em preço escrito do jeito brasileiro:
//   3499 -> "R$ 3.499"      291.5833 -> "R$ 291,58"
// Só mostra os centavos quando eles existem.
function formatarPreco(valor) {
    const temCentavos = Math.round(valor * 100) % 100 !== 0;
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: temCentavos ? 2 : 0,
        maximumFractionDigits: 2
    });
}

// app.locals = variáveis e funções que TODAS as páginas EJS enxergam.
app.locals.formatarPreco = formatarPreco;

// Procura um produto pelo id. Devolve o produto, ou undefined se não existir.
function buscarProduto(id) {
    return PRODUTOS.find(produto => produto.id === id);
}

// Tira acentos e maiúsculas, para "Câmera" e "camera" serem a mesma busca.
function normalizar(texto) {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// Filtra os produtos pelo que a pessoa digitou na busca.
// Cada palavra precisa aparecer no nome ou nas especificações: "iphone 17" acha o iPhone 17, mas não o 16e.
function filtrarPorBusca(produtos, termo) {
    const palavras = normalizar(termo).split(/\s+/).filter(Boolean);
    return produtos.filter(function (produto) {
        const texto = normalizar(produto.nome + ' ' + produto.especificacoes.join(' '));
        return palavras.every(palavra => texto.includes(palavra));
    });
}

// ---------- Rotas (endereço -> página) ----------

// Página inicial. A busca chega pelo endereço: /?busca=iphone
// Como o termo fica no endereço, o botão "Voltar" do navegador desfaz a busca sozinho.
app.get('/', (req, res) => {
    const busca = String(req.query.busca || '').trim().slice(0, 100);
    const produtos = filtrarPorBusca(PRODUTOS, busca);
    res.render('index', { busca, produtos });
});

// Página de um produto: /produto/iphone-17  (":id" é a parte variável do endereço, lida em req.params.id)
app.get('/produto/:id', (req, res) => {
    const produto = buscarProduto(req.params.id);
    if (!produto) {
        // 404 = "não encontrado". A página mostra o estado de erro, com link de volta para a loja.
        return res.status(404).render('produto', { produto: null });
    }
    res.render('produto', { produto, garantia: GARANTIA });
});

// Estas páginas ainda funcionam com o JavaScript do navegador (localStorage), como antes.
// Nas próximas etapas elas passam a falar com o servidor e o banco.
app.get('/carrinho', (req, res) => res.render('carrinho'));
app.get('/checkout', (req, res) => res.render('checkout'));
app.get('/confirmacao', (req, res) => res.render('confirmacao'));
app.get('/login', (req, res) => res.render('login'));
app.get('/cadastro', (req, res) => res.render('cadastro'));
app.get('/design-system', (req, res) => res.render('design-system'));

// ---------- Erros ----------

// Nenhuma rota combinou com o endereço: página 404.
app.use((req, res) => {
    res.status(404).render('erro', {
        titulo: 'Página não encontrada',
        mensagem: 'O endereço que você abriu não existe na CelStore. Confira o que foi digitado ou volte para a loja.'
    });
});

// Algo deu errado dentro de uma rota: registra no terminal e mostra uma mensagem amigável (sem detalhes técnicos).
app.use((erro, req, res, next) => {
    console.error(erro);
    res.status(500).render('erro', {
        titulo: 'Algo deu errado',
        mensagem: 'Tivemos um problema ao abrir esta página. Tente de novo em instantes.'
    });
});

// ---------- Subir o servidor ----------

app.listen(PORTA, () => {
    console.log(`CelStore rodando em http://localhost:${PORTA}`);
});
