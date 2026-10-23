/* =========================================
   PÁGINA DE CADASTRO: validação, carregando, erro e sucesso
   Só é carregado em cadastro.html.
   Depende de produtos.js, carrinho.js, loja.js, formulario.js e usuarios.js, carregados antes.

   Estados:
   - ERRO        -> campos inválidos (um erro embaixo de cada); e-mail que já tem conta;
   - CARREGANDO  -> botão "Criando conta…";
   - SUCESSO     -> a página troca o formulário por "Conta criada com sucesso".
   Só nome e e-mail são guardados. CPF, telefone, nascimento e senha são conferidos e descartados
   (veja o aviso no topo de usuarios.js).
========================================= */

const formEl = document.querySelector('[data-form-cadastro]');
const botaoEl = formEl.querySelector('[data-botao-enviar]');
const linksEl = document.querySelector('.links-auxiliares');
const sucessoEl = document.querySelector('[data-cadastro-sucesso]');

const TEMPO_CADASTRO = 1200; // milissegundos. Simula o tempo que um servidor levaria.

const validador = criarValidador(formEl, [
    { id: 'nome', nome: 'Nome completo', mensagem: 'Informe seu nome completo (nome e sobrenome).', valido: VALIDACOES.nomeCompleto },
    { id: 'cpf', nome: 'CPF', mensagem: 'Informe um CPF válido, no formato 000.000.000-00.', valido: VALIDACOES.cpf },
    { id: 'nascimento', nome: 'Data de nascimento', mensagem: 'Informe uma data de nascimento válida.', valido: VALIDACOES.dataNascimento },
    { id: 'telefone', nome: 'Telefone', mensagem: 'Informe o telefone com DDD, como (82) 99999-9999.', valido: VALIDACOES.telefone },
    { id: 'email', nome: 'E-mail', mensagem: 'Informe um e-mail válido, como nome@exemplo.com.', valido: VALIDACOES.email },
    { id: 'senha', nome: 'Senha', mensagem: 'A senha precisa ter no mínimo 8 caracteres, com letras e números.', valido: VALIDACOES.senha },
    // O segundo parâmetro de "valido" é o formulário: dá para comparar com o campo "senha".
    {
        id: 'confirmar-senha', nome: 'Confirmar senha', mensagem: 'As senhas não conferem.',
        valido: (valor, form) => valor !== '' && valor === form.elements['senha'].value
    },
    // Para uma caixinha (checkbox), o valor chega como true (marcada) ou false.
    { id: 'termos', nome: 'Termos de uso', mensagem: 'Aceite os termos de uso para criar a conta.', valido: marcada => marcada === true }
]);

// ---------- Criar a conta ----------

function concluirCadastro(nome, email) {
    terminarCarregamento(formEl, botaoEl);

    const resultado = cadastrarUsuario(nome, email);

    if (!resultado.ok && resultado.motivo === 'email-existente') {
        // Estado ERRO que só o "servidor" sabe: a mensagem fica embaixo do e-mail e o foco vai para ele.
        validador.erroDoServidor('email', 'E-mail', 'Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.');
        return;
    }
    if (!resultado.ok) {
        mostrarAviso('Não foi possível criar a conta. Verifique se o navegador permite armazenamento e tente de novo.', 'erro');
        return;
    }

    // Estado SUCESSO. Os dados já foram usados: limpamos o formulário (inclusive as senhas) antes de esconder.
    formEl.reset();
    formEl.hidden = true;
    linksEl.hidden = true;
    sucessoEl.hidden = false;
    escrever('data-cadastro-titulo', 'Conta criada com sucesso, ' + primeiroNome(nome) + '!');
    escrever('data-cadastro-email', normalizarEmail(email));
    // O formulário sumiu, então o foco do teclado vai para o título da mensagem.
    document.getElementById('titulo-conta-criada').focus();
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

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    iniciarCarregamento(formEl, botaoEl, 'Criando conta…', 'Criando sua conta. Aguarde.');
    setTimeout(function () {
        concluirCadastro(nome, email);
    }, TEMPO_CADASTRO);
});

// Voltar com o botão "Voltar" do navegador pode trazer a página com o botão ainda "criando".
window.addEventListener('pageshow', function () {
    terminarCarregamento(formEl, botaoEl);
});
