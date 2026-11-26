/* =========================================
   PÁGINA DE LOGIN: validação na tela e estado "carregando"
   Só é carregado na página /login (views/login.ejs).
   Depende de produtos.js, carrinho.js, loja.js e formulario.js, carregados antes.

   Quem confere a senha é o SERVIDOR (POST /login no index.js). Aqui o navegador só:
   - avisa na hora se um campo está vazio ou mal escrito;
   - mostra "Entrando…" enquanto o servidor responde.
========================================= */

const formEl = document.querySelector('[data-form-login]');
const botaoEl = formEl.querySelector('[data-botao-enviar]');
const erroEl = formEl.querySelector('.mensagem-erro');

const validador = criarValidador(formEl, [
    { id: 'email', nome: 'E-mail', mensagem: 'Informe um e-mail válido, como nome@exemplo.com.', valido: VALIDACOES.email },
    // Senha: só não pode estar vazia. (Não usamos trim: um espaço pode fazer parte da senha.)
    { id: 'senha', nome: 'Senha', mensagem: 'Informe a sua senha.', valido: valor => valor !== '' }
]);

formEl.addEventListener('submit', function (evento) {
    if (estaCarregando(botaoEl)) {
        evento.preventDefault(); // ignora cliques repetidos
        return;
    }

    const invalidos = validador.validar();
    if (invalidos.length > 0) {
        evento.preventDefault(); // com erro, o formulário NÃO é enviado
        invalidos[0].focus();
        return;
    }

    // Sem preventDefault: o navegador envia o formulário de verdade (POST /login).
    iniciarCarregamento(formEl, botaoEl, 'Entrando…', 'Entrando na sua conta. Aguarde.');
});

// Se o servidor devolveu "E-mail ou senha incorretos", o foco vai para a mensagem,
// para quem usa teclado ou leitor de tela perceber o erro.
if (erroEl.textContent !== '') {
    erroEl.focus();
}

// Voltar com o botão "Voltar" do navegador pode trazer a página com o botão ainda "entrando".
window.addEventListener('pageshow', function () {
    terminarCarregamento(formEl, botaoEl);
});
