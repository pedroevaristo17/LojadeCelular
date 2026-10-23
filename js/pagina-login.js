/* =========================================
   PÁGINA DE LOGIN: validação, carregando, erro e sucesso
   Só é carregado em login.html.
   Depende de produtos.js, carrinho.js, loja.js, formulario.js e usuarios.js, carregados antes.

   Estados:
   - ERRO        -> e-mail/senha em branco ou inválidos; e-mail sem conta;
   - CARREGANDO  -> botão "Entrando…";
   - SUCESSO     -> a página troca o formulário por "Você entrou na sua conta".
   Lembrete: a senha não é conferida (veja o aviso no topo de usuarios.js).
========================================= */

const formEl = document.querySelector('[data-form-login]');
const botaoEl = formEl.querySelector('[data-botao-enviar]');
const linksEl = document.querySelector('.links-auxiliares');
const sucessoEl = document.querySelector('[data-login-sucesso]');

const TEMPO_LOGIN = 1000; // milissegundos. Simula o tempo que um servidor levaria.
const CHAVE_LEMBRAR = 'celstore-email-lembrado'; // só o e-mail, e só se a pessoa marcar "Lembrar de mim"

const validador = criarValidador(formEl, [
    { id: 'email', nome: 'E-mail', mensagem: 'Informe um e-mail válido, como nome@exemplo.com.', valido: VALIDACOES.email },
    // Senha: só não pode estar vazia. (Não usamos trim: um espaço pode fazer parte da senha.)
    { id: 'senha', nome: 'Senha', mensagem: 'Informe a sua senha.', valido: valor => valor !== '' }
]);

// ---------- Mostrar o estado "logado" ou o formulário ----------

function mostrarLogado(usuario, titulo) {
    formEl.hidden = true;
    linksEl.hidden = true;
    sucessoEl.hidden = false;

    // Nome e e-mail vêm do que a pessoa digitou: entram com textContent (texto puro, nunca HTML).
    escrever('data-login-titulo', titulo + ', ' + primeiroNome(usuario.nome) + '!');
    escrever('data-login-email', usuario.email);

    // O formulário sumiu, então o foco do teclado precisa de um novo lugar: o título da mensagem.
    document.getElementById('titulo-logado').focus();
}

function mostrarFormulario() {
    sucessoEl.hidden = true;
    formEl.hidden = false;
    linksEl.hidden = false;
    preencherLembrado();
}

// ---------- "Lembrar de mim" ----------
// Se a pessoa marcou a caixinha no último login, o e-mail já vem preenchido (a senha nunca é guardada).

function preencherLembrado() {
    const email = lerJSON(CHAVE_LEMBRAR, null);
    if (typeof email === 'string' && email !== '') {
        document.getElementById('email').value = email;
        document.getElementById('lembrar').checked = true;
    }
}

function guardarLembrado(email, lembrar) {
    try {
        if (lembrar) {
            localStorage.setItem(CHAVE_LEMBRAR, JSON.stringify(normalizarEmail(email)));
        } else {
            localStorage.removeItem(CHAVE_LEMBRAR);
        }
    } catch (erro) {
        // sem armazenamento, o login continua funcionando; só não lembra o e-mail
    }
}

// ---------- Entrar ----------

function concluirLogin(email) {
    terminarCarregamento(formEl, botaoEl);

    const usuario = buscarUsuario(email);
    if (!usuario) {
        // Estado ERRO: a mensagem fica embaixo do campo de e-mail e o foco vai para ele.
        validador.erroDoServidor('email', 'E-mail', 'Não encontramos uma conta com este e-mail. Confira o endereço digitado ou cadastre-se.');
        return;
    }
    if (!iniciarSessao(usuario)) {
        mostrarAviso('Não foi possível entrar. Verifique se o navegador permite armazenamento e tente de novo.', 'erro');
        return;
    }

    guardarLembrado(usuario.email, document.getElementById('lembrar').checked);
    formEl.reset(); // limpa o campo de senha da tela
    atualizarConta(); // o menu passa a mostrar "Olá, Ana"
    mostrarLogado(usuario, 'Você entrou na sua conta');
}

formEl.addEventListener('submit', function (evento) {
    evento.preventDefault();
    if (estaCarregando(botaoEl)) {
        return;
    }

    const invalidos = validador.validar();
    if (invalidos.length > 0) {
        invalidos[0].focus();
        return;
    }

    const email = document.getElementById('email').value;
    iniciarCarregamento(formEl, botaoEl, 'Entrando…', 'Entrando na sua conta. Aguarde.');
    setTimeout(function () {
        concluirLogin(email);
    }, TEMPO_LOGIN);
});

document.querySelector('[data-sair]').addEventListener('click', function () {
    encerrarSessao();
    atualizarConta(); // o menu volta a mostrar "Login"
    mostrarFormulario();
    document.getElementById('email').focus();
    mostrarAviso('Você saiu da conta.', 'sucesso');
});

// ---------- Início ----------
preencherLembrado();
// Se a pessoa já está logada (entrou antes e voltou para esta página), mostra direto o estado "logado".
const sessao = lerSessao();
if (sessao) {
    mostrarLogado(sessao, 'Você já entrou na sua conta');
    document.activeElement.blur(); // quem só abriu a página não precisa de foco forçado no título
}

// Voltar com o botão "Voltar" do navegador pode trazer a página com o botão ainda "entrando".
window.addEventListener('pageshow', function () {
    terminarCarregamento(formEl, botaoEl);
});
