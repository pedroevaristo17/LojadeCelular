/* =========================================
   PÁGINA DO CHECKOUT: validação na tela e estado "Processando pedido…"
   Só é carregado na página /checkout (views/checkout.ejs).
   Depende de loja.js e formulario.js, carregados antes.

   Quem grava o pedido é o SERVIDOR (POST /checkout no index.js): ele valida tudo de novo e
   calcula o total com os preços do banco. Aqui o navegador só:
   - mostra os erros antes de enviar (ERRO);
   - mostra "Processando pedido…" e ignora cliques repetidos (CARREGANDO).
========================================= */

const formEl = document.querySelector('[data-form-checkout]');

// Carrinho vazio: a página não tem formulário, só o estado vazio.
if (formEl) {
    ligarCheckout();
}

function ligarCheckout() {
    const botaoEl = formEl.querySelector('[data-botao-confirmar]');

    // Uma regra por campo, com as mesmas mensagens do servidor.
    const validador = criarValidador(formEl, [
        { id: 'nome', nome: 'Nome completo', mensagem: 'Informe seu nome completo (nome e sobrenome).', valido: VALIDACOES.nomeCompleto },
        { id: 'cep', nome: 'CEP', mensagem: 'Informe o CEP no formato 00000-000.', valido: VALIDACOES.cep },
        { id: 'endereco', nome: 'Endereço', mensagem: 'Informe o endereço.', valido: VALIDACOES.naoVazio },
        { id: 'numero', nome: 'Número', mensagem: 'Informe o número (ou S/N, se não tiver).', valido: VALIDACOES.naoVazio },
        { id: 'bairro', nome: 'Bairro', mensagem: 'Informe o bairro.', valido: VALIDACOES.naoVazio },
        { id: 'cidade', nome: 'Cidade', mensagem: 'Informe a cidade.', valido: VALIDACOES.naoVazio },
        { id: 'estado', nome: 'Estado', mensagem: 'Selecione o estado.', valido: VALIDACOES.naoVazio },
        // grupo: 'pagamento' = os 3 rádios com name="pagamento". O valor é o rádio marcado ('' se nenhum).
        { grupo: 'pagamento', nome: 'Forma de pagamento', mensagem: 'Escolha uma forma de pagamento.', valido: VALIDACOES.naoVazio }
    ]);

    formEl.addEventListener('submit', function (evento) {
        if (estaCarregando(botaoEl)) {
            evento.preventDefault(); // já está enviando: um segundo clique não cria outro pedido
            return;
        }

        const invalidos = validador.validar();
        if (invalidos.length > 0) {
            evento.preventDefault(); // com erro, o formulário NÃO é enviado
            invalidos[0].focus();    // leva o teclado direto ao primeiro problema
            return;
        }

        // Sem preventDefault: o navegador envia o formulário de verdade (POST /checkout).
        iniciarCarregamento(formEl, botaoEl, 'Processando pedido…', 'Processando seu pedido. Aguarde.');
    });

    // A página voltou do servidor com erros? O foco vai para o campo do primeiro erro.
    const primeiroErro = formEl.querySelector('.erro-campo');
    if (primeiroErro) {
        primeiroErro.closest('.campo, fieldset').querySelector('input, select').focus();
    }

    // Voltar com o botão "Voltar" do navegador pode trazer a página com o botão ainda "processando".
    window.addEventListener('pageshow', function () {
        terminarCarregamento(formEl, botaoEl);
    });
}
