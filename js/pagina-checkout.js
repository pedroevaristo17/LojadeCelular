/* =========================================
   PÁGINA DO CHECKOUT: resumo do pedido, validação do formulário e finalização
   Só é carregado em checkout.html.
   Depende de produtos.js, carrinho.js, loja.js e pedido.js, carregados antes.

   O caminho do formulário tem 3 estados, que a pessoa precisa conseguir ver:
   1) ERRO       -> campos errados ganham uma mensagem embaixo e o foco vai para o primeiro;
   2) CARREGANDO -> o botão mostra "Processando pedido…" enquanto o pedido é registrado;
   3) SUCESSO    -> o carrinho esvazia e a pessoa vai para a tela de confirmação.
========================================= */

const conteudoEl = document.querySelector('[data-checkout-conteudo]'); // formulário + resumo
const vazioEl = document.querySelector('[data-checkout-vazio]');       // tela de "carrinho vazio"
const formEl = document.querySelector('[data-form-checkout]');
const erroGeralEl = formEl.querySelector('.mensagem-erro');            // resumo dos erros, no topo
const botaoEl = formEl.querySelector('[data-botao-confirmar]');
const pagamentoEl = formEl.querySelector('fieldset.pagamento');

const TEXTO_ORIGINAL_BOTAO = botaoEl.textContent;
const TEMPO_PROCESSAMENTO = 1500; // milissegundos. Simula o tempo que um servidor levaria.
let enviando = false;             // impede enviar duas vezes (clicar de novo enquanto processa)

// ---------- Regras de validação ----------

const naoVazio = valor => valor.trim() !== '';

// Uma regra por campo: qual é o id, o nome que aparece no resumo, a mensagem de erro
// e uma função "valido" que recebe o que foi digitado e devolve true ou false.
const REGRAS = [
    { id: 'nome', nome: 'Nome completo', mensagem: 'Informe seu nome completo.', valido: v => v.trim().length >= 3 },
    // /^[0-9]{5}-?[0-9]{3}$/ = 5 números, hífen opcional, 3 números. Aceita 57000-000 e 57000000.
    { id: 'cep', nome: 'CEP', mensagem: 'Informe o CEP no formato 00000-000.', valido: v => /^[0-9]{5}-?[0-9]{3}$/.test(v.trim()) },
    { id: 'endereco', nome: 'Endereço', mensagem: 'Informe o endereço.', valido: naoVazio },
    { id: 'numero', nome: 'Número', mensagem: 'Informe o número (ou S/N, se não tiver).', valido: naoVazio },
    { id: 'bairro', nome: 'Bairro', mensagem: 'Informe o bairro.', valido: naoVazio },
    { id: 'cidade', nome: 'Cidade', mensagem: 'Informe a cidade.', valido: naoVazio },
    { id: 'estado', nome: 'Estado', mensagem: 'Selecione o estado.', valido: naoVazio }
];

// Guarda o aria-describedby original de cada campo (o CEP, por exemplo, já aponta para a dica de formato).
// Quando aparecer um erro, ele é ADICIONADO à lista; quando sumir, voltamos ao original.
REGRAS.forEach(function (regra) {
    const campo = document.getElementById(regra.id);
    campo.dataset.dica = campo.getAttribute('aria-describedby') || '';
});

// ---------- Mostrar e remover erros ----------

// Cria o parágrafo de erro logo abaixo do campo e marca o campo como inválido.
// aria-invalid="true" faz o leitor de tela dizer "inválido"; o aria-describedby liga o campo à mensagem.
function mostrarErroCampo(campo, nome, mensagem) {
    removerErroCampo(campo);

    const erro = document.createElement('p');
    erro.className = 'erro-campo'; // o CSS coloca o ícone ⚠️ + cor: o erro não depende só da cor
    erro.id = 'erro-' + campo.id;
    erro.dataset.nome = nome;      // usado depois no resumo do topo
    erro.textContent = mensagem;
    campo.closest('.campo').appendChild(erro);

    campo.setAttribute('aria-invalid', 'true');
    campo.setAttribute('aria-describedby', (campo.dataset.dica + ' ' + erro.id).trim());
}

function removerErroCampo(campo) {
    const erro = document.getElementById('erro-' + campo.id);
    if (erro) {
        erro.remove();
    }
    campo.removeAttribute('aria-invalid');
    if (campo.dataset.dica) {
        campo.setAttribute('aria-describedby', campo.dataset.dica);
    } else {
        campo.removeAttribute('aria-describedby');
    }
}

// O pagamento não é um campo só (são 3 rádios dentro de um fieldset), então tem funções próprias.
function mostrarErroPagamento() {
    removerErroPagamento();
    const erro = document.createElement('p');
    erro.className = 'erro-campo';
    erro.id = 'erro-pagamento';
    erro.dataset.nome = 'Forma de pagamento';
    erro.textContent = 'Escolha uma forma de pagamento.';
    pagamentoEl.appendChild(erro);
    pagamentoEl.setAttribute('aria-describedby', 'erro-pagamento');
}

function removerErroPagamento() {
    const erro = document.getElementById('erro-pagamento');
    if (erro) {
        erro.remove();
    }
    pagamentoEl.removeAttribute('aria-describedby');
}

// Escreve (ou apaga) o resumo no topo do formulário: "Corrija 2 campos para continuar: CEP, Estado."
// Ele conta os erros que EXISTEM na tela agora, então nunca fica desatualizado.
function atualizarResumoDeErros() {
    const erros = formEl.querySelectorAll('.erro-campo');
    if (erros.length === 0) {
        erroGeralEl.textContent = ''; // vazio = o CSS esconde a caixa
        return;
    }
    const nomes = Array.from(erros).map(erro => erro.dataset.nome);
    const inicio = erros.length === 1 ? 'Corrija 1 campo para continuar: ' : 'Corrija ' + erros.length + ' campos para continuar: ';
    erroGeralEl.textContent = inicio + nomes.join(', ') + '.';
}

// Confere o formulário inteiro. Devolve a lista de campos com problema (vazia = tudo certo).
function validarFormulario() {
    const invalidos = [];

    REGRAS.forEach(function (regra) {
        const campo = document.getElementById(regra.id);
        if (regra.valido(campo.value)) {
            removerErroCampo(campo);
        } else {
            mostrarErroCampo(campo, regra.nome, regra.mensagem);
            invalidos.push(campo);
        }
    });

    // formEl.elements.pagamento é o grupo dos 3 rádios; .value é o marcado ('' se nenhum).
    if (formEl.elements.pagamento.value === '') {
        mostrarErroPagamento();
        invalidos.push(formEl.querySelector('input[name="pagamento"]'));
    } else {
        removerErroPagamento();
    }

    atualizarResumoDeErros();
    return invalidos;
}

// Enquanto a pessoa corrige, o erro de um campo some assim que ele fica certo
// (ninguém quer ver "campo inválido" depois de já ter consertado).
function revalidarCampo(evento) {
    const campo = evento.target;

    if (campo.name === 'pagamento') {
        removerErroPagamento(); // marcar qualquer rádio já resolve
        atualizarResumoDeErros();
        return;
    }
    if (campo.getAttribute('aria-invalid') !== 'true') {
        return; // só mexe em campo que estava com erro
    }
    const regra = REGRAS.find(r => r.id === campo.id);
    if (regra && regra.valido(campo.value)) {
        removerErroCampo(campo);
        atualizarResumoDeErros();
    }
}

formEl.addEventListener('input', revalidarCampo);
formEl.addEventListener('change', revalidarCampo);

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

// Estado CARREGANDO. O botão NÃO usa "disabled": um botão desabilitado perde o foco do teclado.
// Com aria-disabled="true" ele continua focado, avisa os leitores de tela e o CSS pinta o estado.
function entrarEmCarregamento() {
    enviando = true;
    botaoEl.setAttribute('aria-disabled', 'true');
    botaoEl.textContent = 'Processando pedido…';
    formEl.setAttribute('aria-busy', 'true');
    anunciar('Processando seu pedido. Aguarde.');
}

function sairDoCarregamento() {
    enviando = false;
    botaoEl.removeAttribute('aria-disabled');
    botaoEl.textContent = TEXTO_ORIGINAL_BOTAO;
    formEl.removeAttribute('aria-busy');
}

function confirmarPedido() {
    const pedido = montarPedido();
    if (pedido.itens.length === 0) {
        desenhar(); // o carrinho foi esvaziado em outra aba: mostra a tela de vazio
        return;
    }

    entrarEmCarregamento();

    // setTimeout espera um tempo e depois roda a função. Aqui ele finge o "servidor pensando".
    setTimeout(function () {
        finalizarPedido(pedido);
    }, TEMPO_PROCESSAMENTO);
}

function finalizarPedido(pedido) {
    if (!salvarPedido(pedido)) {
        // Estado ERRO (do sistema, não da pessoa): o pedido NÃO foi registrado, então o carrinho fica intacto.
        sairDoCarregamento();
        mostrarAviso('Não foi possível registrar o pedido. Verifique se o navegador permite armazenamento e tente de novo.', 'erro');
        return;
    }

    // Estado SUCESSO: a ordem importa. Primeiro guardamos o pedido, só depois esvaziamos o carrinho.
    limparCarrinho();
    window.location.href = 'confirmacao.html';
}

formEl.addEventListener('submit', function (evento) {
    evento.preventDefault(); // impede o navegador de recarregar a página
    if (enviando) {
        return;
    }

    const invalidos = validarFormulario();
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
    sairDoCarregamento();
    desenhar();
});
window.addEventListener('storage', desenhar);
