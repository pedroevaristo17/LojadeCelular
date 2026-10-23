/* =========================================
   PÁGINA DO CHECKOUT: resumo do pedido, validação do formulário e finalização
   Só é carregado em checkout.html.
   Depende de produtos.js, carrinho.js, loja.js, formulario.js e pedido.js, carregados antes.

   O caminho do formulário tem 3 estados, que a pessoa precisa conseguir ver:
   1) ERRO       -> campos errados ganham uma mensagem embaixo e o foco vai para o primeiro;
   2) CARREGANDO -> o botão mostra "Processando pedido…" enquanto o pedido é registrado;
   3) SUCESSO    -> o carrinho esvazia e a pessoa vai para a tela de confirmação.
   (A validação e o "carregando" ficam em formulario.js, porque login e cadastro usam o mesmo.)
========================================= */

const conteudoEl = document.querySelector('[data-checkout-conteudo]'); // formulário + resumo
const vazioEl = document.querySelector('[data-checkout-vazio]');       // tela de "carrinho vazio"
const formEl = document.querySelector('[data-form-checkout]');
const botaoEl = formEl.querySelector('[data-botao-confirmar]');

const TEMPO_PROCESSAMENTO = 1500; // milissegundos. Simula o tempo que um servidor levaria.

// ---------- Regras de validação ----------
// Uma regra por campo: id, nome que aparece no resumo, mensagem de erro e a função "valido".
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

// ---------- Enviar o pedido ----------

// Junta tudo o que a pessoa preencheu + o carrinho numa "foto" do pedido.
function montarPedido() {
    const resumo = calcularResumo();
    const valor = id => document.getElementById(id).value.trim();

    return {
        numero: gerarNumeroPedido(),
        data: new Date().toISOString(),
        itens: itensParaPedido(resumo),
        total: resumo.total,
        pagamento: formEl.elements.pagamento.value,
        cliente: { nome: valor('nome') },
        endereco: {
            cep: valor('cep'),
            endereco: valor('endereco'),
            numero: valor('numero'),
            complemento: valor('complemento'),
            bairro: valor('bairro'),
            cidade: valor('cidade'),
            estado: valor('estado')
        }
    };
}

function confirmarPedido() {
    const pedido = montarPedido();
    if (pedido.itens.length === 0) {
        desenhar(); // o carrinho foi esvaziado em outra aba: mostra a tela de vazio
        return;
    }

    // Estado CARREGANDO
    iniciarCarregamento(formEl, botaoEl, 'Processando pedido…', 'Processando seu pedido. Aguarde.');

    // setTimeout espera um tempo e depois roda a função. Aqui ele finge o "servidor pensando".
    setTimeout(function () {
        finalizarPedido(pedido);
    }, TEMPO_PROCESSAMENTO);
}

function finalizarPedido(pedido) {
    if (!salvarPedido(pedido)) {
        // Estado ERRO (do sistema, não da pessoa): o pedido NÃO foi registrado, então o carrinho fica intacto.
        terminarCarregamento(formEl, botaoEl);
        mostrarAviso('Não foi possível registrar o pedido. Verifique se o navegador permite armazenamento e tente de novo.', 'erro');
        return;
    }

    // Estado SUCESSO: a ordem importa. Primeiro guardamos o pedido, só depois esvaziamos o carrinho.
    limparCarrinho();
    window.location.href = 'confirmacao.html';
}

formEl.addEventListener('submit', function (evento) {
    evento.preventDefault(); // impede o navegador de recarregar a página
    if (estaCarregando(botaoEl)) {
        return; // já está processando: ignora cliques repetidos
    }

    const invalidos = validador.validar();
    if (invalidos.length > 0) {
        invalidos[0].focus(); // leva o teclado direto ao primeiro problema (e a página rola até ele)
        return;
    }
    confirmarPedido();
});

// ---------- Desenhar a página ----------

function desenhar() {
    const resumo = calcularResumo();
    const vazio = resumo.linhas.length === 0;

    conteudoEl.hidden = vazio;
    vazioEl.hidden = !vazio;

    if (!vazio) {
        desenharItensResumo(document.querySelector('[data-resumo-itens]'), itensParaPedido(resumo));
        escrever('data-resumo-subtotal', formatarPreco(resumo.total));
        escrever('data-resumo-total', formatarPreco(resumo.total));
    }
}

// ---------- Início ----------
desenhar();

// Se a pessoa voltar para esta página com o botão "Voltar" do navegador, a página pode vir de uma
// cópia guardada, ainda "processando". Aqui voltamos tudo ao normal e redesenhamos com o carrinho atual.
window.addEventListener('pageshow', function () {
    terminarCarregamento(formEl, botaoEl);
    desenhar();
});
window.addEventListener('storage', desenhar);
