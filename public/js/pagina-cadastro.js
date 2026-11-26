/* =========================================
   PÁGINA DE CADASTRO: validação na tela e estado "carregando"
   Só é carregado na página /cadastro (views/cadastro.ejs).
   Depende de produtos.js, carrinho.js, loja.js e formulario.js, carregados antes.

   Quem grava a conta é o SERVIDOR (POST /cadastro no index.js), que valida tudo de novo.
   Aqui o navegador só:
   - mostra um erro embaixo de cada campo inválido, antes de enviar;
   - mostra "Criando conta…" enquanto o servidor responde.
========================================= */

const formEl = document.querySelector('[data-form-cadastro]');

// Depois de criar a conta não existe formulário: a página mostra a mensagem de sucesso.
if (formEl) {
    ligarFormulario();
} else {
    document.getElementById('titulo-conta-criada').focus(); // o leitor de tela lê a confirmação
}

function ligarFormulario() {
    const botaoEl = formEl.querySelector('[data-botao-enviar]');

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

        // Sem preventDefault: o navegador envia o formulário de verdade (POST /cadastro).
        iniciarCarregamento(formEl, botaoEl, 'Criando conta…', 'Criando sua conta. Aguarde.');
    });

    // A página voltou do servidor com erros? O foco vai para o primeiro problema.
    const repetido = formEl.querySelector('[data-repetido]');
    if (repetido) {
        // "E-mail já cadastrado": a mensagem só some quando a pessoa trocar o e-mail.
        validador.erroDoServidor('email', 'E-mail', repetido.textContent);
    } else {
        const primeiroInvalido = formEl.querySelector('[aria-invalid="true"]');
        if (primeiroInvalido) {
            primeiroInvalido.focus();
        }
    }

    // Voltar com o botão "Voltar" do navegador pode trazer a página com o botão ainda "criando".
    window.addEventListener('pageshow', function () {
        terminarCarregamento(formEl, botaoEl);
    });
}
