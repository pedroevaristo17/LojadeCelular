/* =========================================
   USUÁRIOS: contas de mentira, guardadas no navegador
   Usado pelo login e pelo cadastro.

   IMPORTANTE (e vale explicar na apresentação): isto é uma simulação.
   - Guardamos só nome e e-mail. A senha, o CPF e o telefone NÃO são guardados:
     o localStorage pode ser lido por qualquer pessoa que abra o DevTools, então
     dados sensíveis não podem ficar nele. Num site de verdade, o SERVIDOR confere a senha.
   - Por isso o login confere se o e-mail foi cadastrado neste navegador, mas não confere a senha.
========================================= */

const CHAVE_USUARIOS = 'celstore-usuarios'; // lista de { nome, email }
const CHAVE_SESSAO = 'celstore-sessao';     // quem está "logado" agora: { nome, email }

// E-mail "Ana@Exemplo.com " e "ana@exemplo.com" são o mesmo e-mail: guardamos sempre assim.
function normalizarEmail(email) {
    return email.trim().toLowerCase();
}

// Lê um valor do localStorage e devolve o objeto/lista. Se não existe ou está estragado, devolve o "valorPadrao".
function lerJSON(chave, valorPadrao) {
    try {
        const texto = localStorage.getItem(chave);
        return texto ? JSON.parse(texto) : valorPadrao;
    } catch (erro) {
        return valorPadrao;
    }
}

function lerUsuarios() {
    const lista = lerJSON(CHAVE_USUARIOS, []);
    // Só aceita itens com a forma esperada ({ nome, email } de texto).
    return Array.isArray(lista)
        ? lista.filter(u => u && typeof u.nome === 'string' && typeof u.email === 'string')
        : [];
}

// Procura uma conta pelo e-mail. Devolve a conta, ou undefined se não existe.
function buscarUsuario(email) {
    const procurado = normalizarEmail(email);
    return lerUsuarios().find(u => u.email === procurado);
}

// Cria uma conta. Devolve { ok: true } ou { ok: false, motivo: 'email-existente' | 'armazenamento' }.
function cadastrarUsuario(nome, email) {
    if (buscarUsuario(email)) {
        return { ok: false, motivo: 'email-existente' };
    }
    const lista = lerUsuarios();
    lista.push({ nome: nome.trim(), email: normalizarEmail(email) });
    try {
        localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(lista));
        return { ok: true };
    } catch (erro) {
        return { ok: false, motivo: 'armazenamento' };
    }
}

// ---------- Sessão (quem está logado) ----------

// Devolve { nome, email } de quem está logado, ou null.
function lerSessao() {
    const sessao = lerJSON(CHAVE_SESSAO, null);
    return sessao && typeof sessao.nome === 'string' && typeof sessao.email === 'string' ? sessao : null;
}

// Marca a pessoa como logada. Devolve true se deu certo.
function iniciarSessao(usuario) {
    try {
        localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ nome: usuario.nome, email: usuario.email }));
        return true;
    } catch (erro) {
        return false;
    }
}

function encerrarSessao() {
    try {
        localStorage.removeItem(CHAVE_SESSAO);
    } catch (erro) {
        // sem armazenamento não há sessão para apagar
    }
}

// Primeiro nome, para cumprimentar: "Ana Silva" -> "Ana".
function primeiroNome(nomeCompleto) {
    return nomeCompleto.trim().split(/\s+/)[0];
}
