/* =========================================
   SERVIDOR DO CELSTORE
   Etapa 3: produtos e contas ficam no MongoDB; cadastro e login de verdade, com sessão.
   Etapa 4: carrinho na sessão, checkout com login, pedidos no banco e Minhas compras.

   Como funciona (arquitetura cliente-servidor):
   1) o navegador (CLIENTE) pede um endereço, por exemplo GET /produto/iphone-17;
   2) o SERVIDOR (este arquivo) procura a ROTA que combina com esse endereço;
   3) a rota busca os dados no BANCO e manda o EJS montar o HTML (res.render);
   4) o navegador recebe o HTML pronto e mostra a página.
   Arquivos que não mudam (CSS, imagens, JS do navegador) ficam em public/ e são entregues como estão.
========================================= */

// Lê o arquivo .env (se existir) e coloca as configurações em process.env.
// quiet: true -> não imprime dicas do dotenv no terminal.
require('dotenv').config({ quiet: true });

const path = require('path');
const crypto = require('crypto');                 // já vem com o Node: sorteia o número do pedido
const express = require('express');
const session = require('express-session');       // "memória" do servidor sobre cada visitante
const { MongoStore } = require('connect-mongo');  // guarda essa memória dentro do MongoDB
const { MongoClient, ObjectId } = require('mongodb'); // driver oficial do MongoDB
const bcrypt = require('bcrypt');                 // transforma a senha em hash
// PRODUTOS agora só serve para a carga inicial do banco (veja popularProdutos).
const { PRODUTOS, GARANTIA } = require('./dados/produtos');

const app = express();
const PORTA = Number(process.env.PORT) || 3000;

// Configurações do .env. Sem o segredo da sessão não dá para continuar com segurança.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'celstore';
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
    console.error('Falta o SESSION_SECRET. Crie o arquivo .env a partir do .env.example.');
    process.exit(1);
}

// ---------- Banco de dados ----------

// Um único cliente para o servidor inteiro. A conexão começa aqui e é esperada dentro de main().
// serverSelectionTimeoutMS: se o banco estiver desligado, desiste em 5 segundos.
const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
const conexao = client.connect();
let db; // preenchido em main()

const CUSTO_DO_HASH = 10;                       // quanto maior, mais lento (e difícil de adivinhar)
const TRINTA_DIAS = 30 * 24 * 60 * 60 * 1000;   // em milissegundos ("Lembrar de mim")
// Hash de mentira: usado quando o e-mail não existe, para o login demorar o mesmo tempo nos dois casos.
const HASH_FALSO = bcrypt.hashSync('senha-que-ninguem-usa', CUSTO_DO_HASH);

// ---------- Configuração ----------

app.set('view engine', 'ejs');                    // as páginas são templates EJS...
app.set('views', path.join(__dirname, 'views'));  // ...que ficam na pasta views/

app.use(express.urlencoded({ extended: true }));  // lê os dados dos formulários (POST) em req.body
app.use(express.static(path.join(__dirname, 'public'))); // entrega CSS, imagens e JS do navegador

// Sessão: o navegador recebe um cookie só com o número da sessão; os dados ficam no MongoDB
// (coleção "sessions"). Por isso a pessoa continua logada mesmo se o servidor reiniciar.
app.use(session({
    secret: SESSION_SECRET,        // assina o cookie: ninguém consegue falsificar
    resave: false,                 // não regrava a sessão se nada mudou
    saveUninitialized: false,      // não cria sessão para quem só está olhando
    store: MongoStore.create({ clientPromise: conexao, dbName: MONGODB_DB, collectionName: 'sessions' }),
    cookie: {
        httpOnly: true,            // o JavaScript do navegador não consegue ler o cookie
        sameSite: 'lax'            // outros sites não enviam o cookie em formulários POST
        // sem maxAge: o cookie some quando o navegador fecha (o login muda isso com "Lembrar de mim")
    }
}));

// res.locals = variáveis que a página DESTE pedido enxerga.
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;      // o menu mostra "Olá, Nome"
    // O contador do menu soma as unidades guardadas na sessão.
    res.locals.unidadesNoCarrinho = lerCarrinho(req).reduce((soma, item) => soma + item.quantidade, 0);
    res.locals.urlAtual = req.originalUrl;           // para os formulários voltarem à mesma página
    // Aviso "de uma vez só": a rota anterior guardou na sessão, esta página mostra e apaga.
    res.locals.aviso = req.session.aviso || null;
    delete req.session.aviso;
    next(); // segue para a próxima etapa (a rota)
});

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
// "Ana Silva" -> "Ana", para o cumprimento do menu.
app.locals.primeiroNome = nomeCompleto => nomeCompleto.trim().split(/\s+/)[0];

// Código guardado no pedido -> texto para a tela.
const PAGAMENTOS = {
    pix: 'Pix',
    cartao: 'Cartão de crédito (até 12x sem juros)',
    boleto: 'Boleto bancário'
};
app.locals.PAGAMENTOS = PAGAMENTOS;

// Data do pedido: "26/11/2026 às 15:40" (no fuso de Maceió).
app.locals.formatarData = data =>
    data.toLocaleDateString('pt-BR', { timeZone: 'America/Maceio' }) + ' às ' +
    data.toLocaleTimeString('pt-BR', { timeZone: 'America/Maceio', hour: '2-digit', minute: '2-digit' });

// "Rua A, 10 - Apto 2 - Farol, Maceió/AL - CEP 57000-000" (sem buraco quando não há complemento).
app.locals.montarEndereco = e =>
    e.endereco + ', ' + e.numero + (e.complemento ? ' - ' + e.complemento : '') +
    ' - ' + e.bairro + ', ' + e.cidade + '/' + e.estado + ' - CEP ' + e.cep;

// ---------- Carrinho (guardado na sessão) ----------

const QUANTIDADE_MAXIMA = 10; // mesmo limite de antes: até 10 unidades de cada celular

// O carrinho é uma lista de { slug, quantidade }. Preço e nome NÃO ficam aqui:
// vêm do banco na hora de mostrar, então ninguém consegue mudar o preço pelo navegador.
function lerCarrinho(req) {
    return Array.isArray(req.session.carrinho) ? req.session.carrinho : [];
}

// Junta o carrinho com os produtos do banco e faz as contas. Usado no carrinho e no checkout.
// Devolve { linhas: [{ produto, quantidade, subtotal }], unidades, total }.
async function montarResumo(req) {
    const itens = lerCarrinho(req);
    const slugs = itens.map(item => item.slug);
    // $in = "o slug é um destes". Uma consulta só para todos os itens.
    const produtos = await db.collection('products').find({ slug: { $in: slugs } }).toArray();

    const linhas = [];
    let unidades = 0;
    let total = 0;
    for (const item of itens) {
        const produto = produtos.find(p => p.slug === item.slug);
        if (!produto) {
            continue; // o produto saiu da loja: ignora
        }
        const subtotal = produto.preco * item.quantidade;
        linhas.push({ produto, quantidade: item.quantidade, subtotal });
        unidades += item.quantidade;
        total += subtotal;
    }
    return { linhas, unidades, total };
}

// Quantidade que veio do formulário -> número inteiro. "abc" ou vazio viram NaN.
function lerQuantidade(valor) {
    return Math.floor(Number(lerTexto(valor)));
}

// Guarda um aviso para a PRÓXIMA página mostrar (depois do redirecionamento).
// tipo: 'sucesso' ou 'erro'. extras: { verCarrinho: true } ou { desfazer: { slug, quantidade } }.
function avisar(req, texto, tipo, extras = {}) {
    req.session.aviso = { texto, tipo, ...extras };
}

// ---------- Checkout: validação ----------

const ESTADOS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
    'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

// Mesmas regras e mensagens da tela (public/js/pagina-checkout.js).
const naoVazio = valor => valor !== '' && valor.length <= 100;
const REGRAS_CHECKOUT = [
    { id: 'nome', nome: 'Nome completo', mensagem: 'Informe seu nome completo (nome e sobrenome).',
        valido: d => d.nome.split(/\s+/).length >= 2 && d.nome.length >= 5 && d.nome.length <= 100 },
    { id: 'cep', nome: 'CEP', mensagem: 'Informe o CEP no formato 00000-000.', valido: d => /^\d{5}-?\d{3}$/.test(d.cep) },
    { id: 'endereco', nome: 'Endereço', mensagem: 'Informe o endereço.', valido: d => naoVazio(d.endereco) },
    { id: 'numero', nome: 'Número', mensagem: 'Informe o número (ou S/N, se não tiver).', valido: d => naoVazio(d.numero) },
    { id: 'complemento', nome: 'Complemento', mensagem: 'Use no máximo 100 caracteres.', valido: d => d.complemento.length <= 100 },
    { id: 'bairro', nome: 'Bairro', mensagem: 'Informe o bairro.', valido: d => naoVazio(d.bairro) },
    { id: 'cidade', nome: 'Cidade', mensagem: 'Informe a cidade.', valido: d => naoVazio(d.cidade) },
    { id: 'estado', nome: 'Estado', mensagem: 'Selecione o estado.', valido: d => ESTADOS.includes(d.estado) },
    { id: 'pagamento', nome: 'Forma de pagamento', mensagem: 'Escolha uma forma de pagamento.',
        valido: d => Object.hasOwn(PAGAMENTOS, d.pagamento) }
];

// Confere uma lista de regras. Devolve { idDoCampo: { nome, mensagem } } (vazio = tudo certo).
function validar(regras, dados) {
    const erros = {};
    for (const regra of regras) {
        if (!regra.valido(dados)) {
            erros[regra.id] = { nome: regra.nome, mensagem: regra.mensagem };
        }
    }
    return erros;
}

// "CEL-" + 6 algarismos sorteados. O índice único do banco garante que não se repete.
function gerarNumeroPedido() {
    return 'CEL-' + String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

// Sessões que estão gravando um pedido agora: um segundo clique no mesmo instante é ignorado.
const pedidosEmAndamento = new Set();

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

// ---------- Cadastro e login: ajudantes ----------

// O que chega do formulário pode ser qualquer coisa (até uma lista ou um objeto).
// Só aceitamos texto; o resto vira ''.
function lerTexto(valor) {
    return typeof valor === 'string' ? valor : '';
}

// CPF de verdade: 11 números e os 2 dígitos finais precisam bater com a conta dos anteriores.
function cpfValido(valor) {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) {
        return false;
    }
    function digito(quantos) {
        let soma = 0;
        for (let i = 0; i < quantos; i++) {
            soma += Number(numeros[i]) * (quantos + 1 - i);
        }
        const resto = (soma * 10) % 11;
        return resto === 10 ? 0 : resto;
    }
    return digito(9) === Number(numeros[9]) && digito(10) === Number(numeros[10]);
}

// A data chega como "2000-12-31". Precisa existir, não ser no futuro e ser de 1900 para cá.
function dataNascimentoValida(valor) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        return false;
    }
    const data = new Date(valor + 'T00:00:00Z');
    // A segunda conferência recusa datas como 31/02, que o JavaScript "empurra" para março.
    return !isNaN(data.getTime()) && data.toISOString().startsWith(valor) &&
        data <= new Date() && data.getUTCFullYear() >= 1900;
}

// Uma regra por campo, com as MESMAS mensagens da tela (public/js/pagina-cadastro.js).
// O navegador valida para ajudar a pessoa; o servidor valida porque não confia no navegador.
const REGRAS_CADASTRO = [
    { id: 'nome', nome: 'Nome completo', mensagem: 'Informe seu nome completo (nome e sobrenome).',
        valido: d => d.nome.split(/\s+/).length >= 2 && d.nome.length >= 5 && d.nome.length <= 100 },
    { id: 'cpf', nome: 'CPF', mensagem: 'Informe um CPF válido, no formato 000.000.000-00.',
        valido: d => cpfValido(d.cpf) },
    { id: 'nascimento', nome: 'Data de nascimento', mensagem: 'Informe uma data de nascimento válida.',
        valido: d => dataNascimentoValida(d.nascimento) },
    { id: 'telefone', nome: 'Telefone', mensagem: 'Informe o telefone com DDD, como (82) 99999-9999.',
        valido: d => /^\d{10,11}$/.test(d.telefone.replace(/\D/g, '')) },
    { id: 'email', nome: 'E-mail', mensagem: 'Informe um e-mail válido, como nome@exemplo.com.',
        valido: d => d.email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email) },
    { id: 'senha', nome: 'Senha', mensagem: 'A senha precisa ter no mínimo 8 caracteres, com letras e números.',
        valido: d => d.senha.length >= 8 && /[A-Za-z]/.test(d.senha) && /[0-9]/.test(d.senha) },
    { id: 'confirmar-senha', nome: 'Confirmar senha', mensagem: 'As senhas não conferem.',
        valido: d => d.confirmacao !== '' && d.confirmacao === d.senha },
    { id: 'termos', nome: 'Termos de uso', mensagem: 'Aceite os termos de uso para criar a conta.',
        valido: d => d.termos }
];

// Mostra o formulário de cadastro. "valores" é o que a pessoa digitou (nunca inclui as senhas).
function mostrarCadastro(res, { status = 200, valores = {}, erros = {}, contaCriada = null } = {}) {
    res.status(status).render('cadastro', { valores, erros, contaCriada });
}

// Aceita só endereços do próprio site em ?voltar=. "//outrosite.com" e "\" levariam para fora.
function caminhoSeguro(valor) {
    const caminho = lerTexto(valor);
    const interno = caminho.startsWith('/') && !caminho.startsWith('//') && !/[\\\x00-\x1f]/.test(caminho);
    return interno ? caminho : '';
}

// Middleware: só deixa passar quem está logado. Os outros vão para o login e depois voltam.
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login?voltar=' + encodeURIComponent(req.originalUrl));
    }
    next();
}

// ---------- Rotas (endereço -> página) ----------

// Lê os produtos do banco, na ordem em que foram gravados.
function listarProdutos() {
    return db.collection('products').find().sort({ _id: 1 }).toArray();
}

// Página inicial. A busca chega pelo endereço: /?busca=iphone
// Como o termo fica no endereço, o botão "Voltar" do navegador desfaz a busca sozinho.
// "async/await": a rota espera o banco responder antes de montar a página.
app.get('/', async (req, res) => {
    const busca = String(req.query.busca || '').trim().slice(0, 100);
    const produtos = filtrarPorBusca(await listarProdutos(), busca);
    res.render('index', { busca, produtos });
});

// Página de um produto: /produto/iphone-17  (":slug" é a parte variável do endereço, lida em req.params.slug)
app.get('/produto/:slug', async (req, res) => {
    const produto = await db.collection('products').findOne({ slug: req.params.slug });
    if (!produto) {
        // 404 = "não encontrado". A página mostra o estado de erro, com link de volta para a loja.
        return res.status(404).render('produto', { produto: null });
    }
    res.render('produto', { produto, garantia: GARANTIA });
});

// ----- Cadastro -----

app.get('/cadastro', (req, res) => {
    // Recado de "conta criada": lido uma vez e apagado da sessão.
    const contaCriada = req.session.contaCriada || null;
    delete req.session.contaCriada;

    if (req.session.user && !contaCriada) {
        return res.redirect('/conta'); // quem já entrou não precisa se cadastrar
    }
    mostrarCadastro(res, { contaCriada });
});

app.post('/cadastro', async (req, res) => {
    const corpo = req.body || {}; // os campos do formulário

    const dados = {
        nome: lerTexto(corpo.nome).trim(),
        cpf: lerTexto(corpo.cpf).trim(),
        nascimento: lerTexto(corpo.nascimento),
        telefone: lerTexto(corpo.telefone).trim(),
        email: lerTexto(corpo.email).trim().toLowerCase(),
        senha: lerTexto(corpo.senha),
        confirmacao: lerTexto(corpo['confirmar-senha']),
        termos: corpo.termos === 'on',   // caixinha marcada chega como "on"
        ofertas: corpo.ofertas === 'on'
    };

    // O que volta para o formulário em caso de erro: tudo, MENOS as senhas.
    const { senha, confirmacao, ...valores } = dados;

    const erros = validar(REGRAS_CADASTRO, dados);
    if (Object.keys(erros).length > 0) {
        // 400 = "o pedido veio com dados errados"
        return mostrarCadastro(res, { status: 400, valores, erros });
    }

    // bcrypt.hash gera um texto que começa com "$2b$". Não dá para voltar dele para a senha.
    const passwordHash = await bcrypt.hash(senha, CUSTO_DO_HASH);

    try {
        // CPF, telefone e nascimento foram conferidos e NÃO são guardados.
        await db.collection('users').insertOne({
            nome: dados.nome,
            email: dados.email,
            passwordHash,
            createdAt: new Date()
        });
    } catch (erro) {
        // 11000 = o índice único recusou: já existe uma conta com este e-mail.
        if (erro.code === 11000) {
            erros.email = {
                nome: 'E-mail',
                mensagem: 'Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.',
                repetido: true
            };
            return mostrarCadastro(res, { status: 409, valores, erros }); // 409 = conflito
        }
        throw erro; // outro problema: vai para a página de erro 500
    }

    // Redireciona depois do POST: assim, recarregar a página não envia o cadastro de novo.
    req.session.contaCriada = { nome: dados.nome, email: dados.email };
    res.redirect(303, '/cadastro');
});

// ----- Login e logout -----

app.get('/login', (req, res) => {
    const voltar = caminhoSeguro(req.query.voltar);
    if (req.session.user) {
        return res.redirect(voltar || '/conta');
    }
    res.render('login', { erro: '', email: '', lembrar: false, voltar });
});

app.post('/login', async (req, res, next) => {
    const corpo = req.body || {};
    const email = lerTexto(corpo.email).trim().toLowerCase();
    const senha = lerTexto(corpo.senha);
    const lembrar = corpo.lembrar === 'on';
    const voltar = caminhoSeguro(req.query.voltar);

    const usuario = await db.collection('users').findOne({ email });
    // compare() faz o hash da senha digitada e confere com o hash guardado.
    const senhaCerta = await bcrypt.compare(senha, usuario ? usuario.passwordHash : HASH_FALSO);

    if (!usuario || !senhaCerta) {
        // Mensagem genérica: não conta se o e-mail existe ou não. 401 = "não autorizado".
        return res.status(401).render('login', { erro: 'E-mail ou senha incorretos.', email, lembrar, voltar });
    }

    // regenerate() troca o número da sessão no momento do login (protege contra "roubo" de sessão).
    // A sessão nova nasce vazia, então guardamos o carrinho antes e copiamos depois.
    const carrinho = lerCarrinho(req);
    req.session.regenerate(erroSessao => {
        if (erroSessao) {
            return next(erroSessao);
        }
        if (carrinho.length > 0) {
            req.session.carrinho = carrinho;
        }
        // Na sessão vai só o necessário. O hash da senha NUNCA.
        req.session.user = { id: usuario._id.toString(), nome: usuario.nome, email: usuario.email };
        if (lembrar) {
            req.session.cookie.maxAge = TRINTA_DIAS;
        }
        // Grava no banco antes de redirecionar, para a próxima página já encontrar a pessoa logada.
        req.session.save(erroGravacao => {
            if (erroGravacao) {
                return next(erroGravacao);
            }
            res.redirect(303, voltar || '/conta');
        });
    });
});

// Sair é POST (e não um link) porque muda algo no servidor.
app.post('/sair', (req, res, next) => {
    req.session.destroy(erro => {      // apaga a sessão do banco
        if (erro) {
            return next(erro);
        }
        res.clearCookie('connect.sid'); // e o cookie do navegador
        res.redirect(303, '/');
    });
});

// ----- Minha conta -----

// requireAuth roda antes: sem login, a rota nem chega a montar a página.
app.get('/conta', requireAuth, async (req, res) => {
    res.set('Cache-Control', 'no-store'); // depois de sair, o "Voltar" não mostra a conta guardada
    // Minhas compras: SÓ os pedidos desta pessoa, do mais novo para o mais antigo.
    const pedidos = await db.collection('orders')
        .find({ userId: new ObjectId(req.session.user.id) })
        .sort({ createdAt: -1 })
        .toArray();
    res.render('conta', { pedidos });
});

// ----- Carrinho -----
// As rotas POST mudam o carrinho e REDIRECIONAM (padrão "POST -> redirecionar -> GET"):
// recarregar a página depois não repete a ação.

app.get('/carrinho', async (req, res) => {
    res.render('carrinho', { resumo: await montarResumo(req), QUANTIDADE_MAXIMA });
});

app.post('/carrinho/adicionar', async (req, res) => {
    const corpo = req.body || {};
    const voltar = caminhoSeguro(corpo.voltar) || '/carrinho';
    // O produto é conferido no BANCO: um slug inventado no DevTools não entra no carrinho.
    const produto = await db.collection('products').findOne({ slug: lerTexto(corpo.slug) });
    const pedida = lerQuantidade(corpo.quantidade || '1');

    if (!produto) {
        avisar(req, 'Produto não encontrado.', 'erro');
        return res.redirect(303, voltar);
    }
    if (!(pedida >= 1)) {   // pega 0, negativos e NaN
        avisar(req, 'Informe uma quantidade de 1 a ' + QUANTIDADE_MAXIMA + '.', 'erro');
        return res.redirect(303, voltar);
    }

    const carrinho = lerCarrinho(req);
    const item = carrinho.find(i => i.slug === produto.slug);
    const atual = item ? item.quantidade : 0;

    if (atual >= QUANTIDADE_MAXIMA) {
        avisar(req, 'Limite de ' + QUANTIDADE_MAXIMA + ' unidades de ' + produto.nome + ' por pedido.', 'erro', { verCarrinho: true });
        return res.redirect(303, voltar);
    }

    const nova = Math.min(atual + pedida, QUANTIDADE_MAXIMA);
    if (item) {
        item.quantidade = nova;
    } else {
        carrinho.push({ slug: produto.slug, quantidade: nova });
    }
    req.session.carrinho = carrinho;

    if (atual + pedida > nova) {
        avisar(req, 'O limite é de ' + QUANTIDADE_MAXIMA + ' unidades de ' + produto.nome +
            ' por pedido. Seu carrinho ficou com ' + nova + '.', 'erro', { verCarrinho: true });
    } else {
        const unidades = nova > 1 ? ' (' + nova + ' unidades no carrinho)' : '';
        avisar(req, produto.nome + ' adicionado ao carrinho' + unidades + '.', 'sucesso', { verCarrinho: true });
    }
    res.redirect(303, voltar);
});

app.post('/carrinho/atualizar', async (req, res) => {
    const corpo = req.body || {};
    const item = lerCarrinho(req).find(i => i.slug === lerTexto(corpo.slug));
    if (!item) {
        return res.redirect(303, '/carrinho');
    }
    const produto = await db.collection('products').findOne({ slug: item.slug });
    const nome = produto ? produto.nome : 'este produto';
    const pedida = lerQuantidade(corpo.quantidade);

    // Valores sem sentido são corrigidos (em vez de recusados), e a pessoa é avisada.
    if (!(pedida >= 1)) {
        item.quantidade = 1;
        avisar(req, 'A quantidade mínima é 1. Para tirar ' + nome + ' do carrinho, use o botão Remover.', 'erro');
    } else if (pedida > QUANTIDADE_MAXIMA) {
        item.quantidade = QUANTIDADE_MAXIMA;
        avisar(req, 'Limite de ' + QUANTIDADE_MAXIMA + ' unidades de ' + nome + ' por pedido. A quantidade foi ajustada para ' + QUANTIDADE_MAXIMA + '.', 'erro');
    } else {
        item.quantidade = pedida;
        avisar(req, 'Quantidade de ' + nome + ' atualizada para ' + pedida + '.', 'sucesso');
    }
    res.redirect(303, '/carrinho');
});

app.post('/carrinho/remover', async (req, res) => {
    const slug = lerTexto((req.body || {}).slug);
    const carrinho = lerCarrinho(req);
    const item = carrinho.find(i => i.slug === slug);
    if (item) {
        req.session.carrinho = carrinho.filter(i => i !== item);
        const produto = await db.collection('products').findOne({ slug });
        // "Desfazer": o aviso traz um botão que adiciona de volta a mesma quantidade.
        avisar(req, (produto ? produto.nome : 'Item') + ' removido do carrinho.', 'sucesso',
            { desfazer: { slug, quantidade: item.quantidade } });
    }
    res.redirect(303, '/carrinho');
});

// ----- Checkout e pedido -----

// Mostra o checkout. Carrinho vazio = estado vazio (sem formulário).
async function mostrarCheckout(req, res, { status = 200, valores = {}, erros = {} } = {}) {
    res.status(status).render('checkout', { resumo: await montarResumo(req), valores, erros, ESTADOS });
}

app.get('/checkout', requireAuth, (req, res) => mostrarCheckout(req, res));

app.post('/checkout', requireAuth, async (req, res) => {
    const corpo = req.body || {};
    const campo = nome => lerTexto(corpo[nome]).trim();
    const dados = {
        nome: campo('nome'), cep: campo('cep'), endereco: campo('endereco'), numero: campo('numero'),
        complemento: campo('complemento'), bairro: campo('bairro'), cidade: campo('cidade'),
        estado: campo('estado'), pagamento: campo('pagamento')
    };

    // Os preços vêm do BANCO agora. Qualquer preço ou total enviado pelo navegador é ignorado.
    const resumo = await montarResumo(req);
    if (resumo.linhas.length === 0) {
        return res.redirect(303, '/checkout'); // nada a comprar: mostra o estado vazio
    }

    const erros = validar(REGRAS_CHECKOUT, dados);
    if (Object.keys(erros).length > 0) {
        return mostrarCheckout(req, res, { status: 400, valores: dados, erros });
    }

    // Dois cliques ao mesmo tempo: o segundo espera o primeiro terminar e cai no carrinho vazio.
    if (pedidosEmAndamento.has(req.sessionID)) {
        return res.redirect(303, '/conta');
    }
    pedidosEmAndamento.add(req.sessionID);
    try {
        const { pagamento, ...endereco } = dados;
        endereco.cep = endereco.cep.replace(/^(\d{5})-?(\d{3})$/, '$1-$2'); // 57000000 -> 57000-000

        const pedido = {
            userId: new ObjectId(req.session.user.id), // o DONO vem da sessão, nunca do formulário
            // Os itens são uma "foto" do momento da compra: se o preço mudar amanhã, o pedido não muda.
            itens: resumo.linhas.map(l => ({
                slug: l.produto.slug, nome: l.produto.nome, preco: l.produto.preco,
                quantidade: l.quantidade, subtotal: l.subtotal
            })),
            total: resumo.total,
            pagamento,
            endereco,
            createdAt: new Date()
        };

        // Se o número sorteado já existir (erro 11000), sorteia outro.
        for (let tentativa = 1; ; tentativa++) {
            try {
                pedido.numero = gerarNumeroPedido();
                await db.collection('orders').insertOne(pedido);
                break;
            } catch (erro) {
                delete pedido._id; // o driver põe um _id no objeto; a próxima tentativa precisa de outro
                if (erro.code !== 11000 || tentativa === 5) {
                    throw erro;
                }
            }
        }

        // Só depois de gravar: esvazia o carrinho e vai para a confirmação.
        // Redirecionar faz o "recarregar" abrir a confirmação, e não criar outro pedido.
        req.session.carrinho = [];
        req.session.save(() => {
            pedidosEmAndamento.delete(req.sessionID);
            res.redirect(303, '/pedido/' + pedido.numero);
        });
    } catch (erro) {
        pedidosEmAndamento.delete(req.sessionID);
        throw erro;
    }
});

// Confirmação: busca pelo número E pelo dono. Pedido de outra pessoa = 404, igual a um que não existe.
app.get('/pedido/:numero', requireAuth, async (req, res) => {
    const pedido = await db.collection('orders').findOne({
        numero: req.params.numero,
        userId: new ObjectId(req.session.user.id)
    });
    if (!pedido) {
        return res.status(404).render('erro', {
            titulo: 'Pedido não encontrado',
            mensagem: 'Não encontramos este pedido na sua conta. Confira suas compras em Minha conta.'
        });
    }
    res.render('confirmacao', { pedido });
});

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

// Carga inicial: se a coleção "products" estiver vazia, copia a lista de dados/produtos.js.
// O "id" do arquivo vira o campo "slug", usado nos endereços (/produto/galaxy-s26).
async function popularProdutos() {
    const colecao = db.collection('products');
    if (await colecao.countDocuments() === 0) {
        await colecao.insertMany(PRODUTOS.map(({ id, ...resto }) => ({ slug: id, ...resto })));
        console.log(`Carga inicial: ${PRODUTOS.length} produtos gravados no banco.`);
    }
}

// Ordem: 1) conectar no banco, 2) criar índices, 3) carregar produtos, 4) aceitar visitas.
async function main() {
    await conexao;
    db = client.db(MONGODB_DB);

    // Índice único = o próprio banco impede dois e-mails (ou dois slugs) iguais.
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('products').createIndex({ slug: 1 }, { unique: true });
    await db.collection('orders').createIndex({ numero: 1 }, { unique: true });
    // Acelera "Minhas compras": pedidos de uma pessoa, do mais novo para o mais antigo.
    await db.collection('orders').createIndex({ userId: 1, createdAt: -1 });
    await popularProdutos();

    app.listen(PORTA, () => {
        console.log(`CelStore rodando em http://localhost:${PORTA}`);
    });
}

main().catch(erro => {
    console.error('Falha ao iniciar. O MongoDB está ligado? (docker compose up -d)');
    console.error(erro.message);
    process.exit(1);
});
