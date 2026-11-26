/* =========================================
   FORMULÁRIO: validação e estado "carregando", compartilhados
   Usado pelo checkout, pelo login e pelo cadastro.
   Depende de loja.js (função anunciar), carregado antes.

   Duas partes:
   1) VALIDACOES    -> funções prontas que dizem "isto está certo?" (CEP, e-mail, CPF...);
   2) criarValidador -> liga uma lista de regras a um <form>: mostra o erro embaixo de cada
                        campo, o resumo no topo e tira o erro quando a pessoa corrige.
   Mais o estado "carregando" do botão (iniciarCarregamento / terminarCarregamento).
========================================= */

// ---------- 1) Validações prontas ----------
// Cada uma recebe o texto digitado e devolve true (certo) ou false (errado).

const VALIDACOES = {
    naoVazio: valor => valor.trim() !== '',

    // Nome completo = pelo menos duas palavras ("Ana Silva").
    nomeCompleto: valor => valor.trim().split(/\s+/).length >= 2 && valor.trim().length >= 5,

    // Algo@algo.algo : sem espaços, com um @ e um ponto depois dele.
    email: valor => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim()),

    // Mínimo de 8 caracteres, com pelo menos uma letra e um número (é o que a dica na tela promete).
    senha: valor => valor.length >= 8 && /[A-Za-z]/.test(valor) && /[0-9]/.test(valor),

    // 5 números, hífen opcional, 3 números. Aceita 57000-000 e 57000000.
    cep: valor => /^[0-9]{5}-?[0-9]{3}$/.test(valor.trim()),

    // Telefone com DDD: 10 ou 11 números, com ou sem ( ) e hífen.
    telefone: function (valor) {
        const numeros = valor.replace(/\D/g, ''); // tira tudo que não é número
        return /^[0-9]{10,11}$/.test(numeros);
    },

    // CPF de verdade: 11 números e os 2 dígitos finais precisam bater com a conta dos anteriores.
    cpf: function (valor) {
        const numeros = valor.replace(/\D/g, '');
        if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) {
            return false; // tamanho errado, ou todos os dígitos iguais (111.111.111-11 não vale)
        }
        // Calcula um dígito verificador: soma cada número vezes um peso (que vai diminuindo).
        function digito(quantos) {
            let soma = 0;
            for (let i = 0; i < quantos; i++) {
                soma += Number(numeros[i]) * (quantos + 1 - i);
            }
            const resto = (soma * 10) % 11;
            return resto === 10 ? 0 : resto;
        }
        return digito(9) === Number(numeros[9]) && digito(10) === Number(numeros[10]);
    },

    // <input type="date"> entrega "2000-12-31" (ou "" se estiver incompleto).
    dataNascimento: function (valor) {
        if (valor === '') {
            return false;
        }
        const data = new Date(valor + 'T00:00:00');
        return !isNaN(data.getTime()) && data <= new Date() && data.getFullYear() >= 1900;
    }
};

// ---------- 2) Validador de formulário ----------

// regras: lista de objetos
//   { id: 'cep', nome: 'CEP', mensagem: 'Informe o CEP...', valido: (valor, formulario) => true/false }
// Para um GRUPO de rádios (como a forma de pagamento) use  grupo: 'pagamento'  no lugar de id.
// Para uma caixinha (checkbox), "valor" chega como true/false.
function criarValidador(formEl, regras) {
    const erroGeralEl = formEl.querySelector('.mensagem-erro'); // resumo dos erros, no topo
    let regrasExtras = []; // erros que só o "servidor" descobre (ex.: e-mail já cadastrado)

    // ----- Como achar as coisas de cada regra -----
    function elementoDe(regra) {
        // Para grupo, o erro se liga ao <fieldset> que envolve os rádios.
        return regra.grupo
            ? formEl.querySelector('input[name="' + regra.grupo + '"]').closest('fieldset')
            : document.getElementById(regra.id);
    }
    function chaveDe(regra) {
        return regra.grupo || regra.id;
    }
    function valorDe(regra, el) {
        if (regra.grupo) {
            return formEl.elements[regra.grupo].value; // o rádio marcado ('' se nenhum)
        }
        return el.type === 'checkbox' ? el.checked : el.value;
    }
    function focoDe(regra, el) {
        return regra.grupo ? formEl.querySelector('input[name="' + regra.grupo + '"]') : el;
    }
    function temErro(regra) {
        return document.getElementById('erro-' + chaveDe(regra)) !== null;
    }

    // Guarda o aria-describedby original de cada campo (o CEP, por exemplo, já aponta para a dica de formato).
    // Quando aparece um erro ele é ADICIONADO à lista; quando some, voltamos ao original.
    regras.forEach(function (regra) {
        const el = elementoDe(regra);
        el.dataset.dica = el.getAttribute('aria-describedby') || '';
    });

    // ----- Mostrar e tirar erros -----

    // Cria o parágrafo de erro e marca o campo como inválido.
    // aria-invalid="true" faz o leitor de tela dizer "inválido"; aria-describedby liga o campo à mensagem.
    function mostrarErro(regra, el) {
        removerErro(regra, el);

        const erro = document.createElement('p');
        erro.className = 'erro-campo'; // o CSS põe o ícone ⚠️ + cor: o erro não depende só da cor
        erro.id = 'erro-' + chaveDe(regra);
        erro.dataset.nome = regra.nome; // usado no resumo do topo
        erro.textContent = regra.mensagem;

        (regra.grupo ? el : el.closest('.campo')).appendChild(erro);

        if (!regra.grupo) {
            el.setAttribute('aria-invalid', 'true');
        }
        el.setAttribute('aria-describedby', (el.dataset.dica + ' ' + erro.id).trim());
    }

    function removerErro(regra, el) {
        const erro = document.getElementById('erro-' + chaveDe(regra));
        if (erro) {
            erro.remove();
        }
        el.removeAttribute('aria-invalid');
        if (el.dataset.dica) {
            el.setAttribute('aria-describedby', el.dataset.dica);
        } else {
            el.removeAttribute('aria-describedby');
        }
    }

    // Escreve (ou apaga) o resumo no topo: "Corrija 2 campos para continuar: CEP, Estado."
    // Conta os erros que EXISTEM na tela agora, então nunca fica desatualizado.
    function atualizarResumo() {
        const erros = formEl.querySelectorAll('.erro-campo');
        if (erros.length === 0) {
            erroGeralEl.textContent = ''; // vazio = o CSS esconde a caixa
            return;
        }
        const nomes = Array.from(erros).map(erro => erro.dataset.nome);
        const inicio = erros.length === 1 ? 'Corrija 1 campo para continuar: ' : 'Corrija ' + erros.length + ' campos para continuar: ';
        erroGeralEl.textContent = inicio + nomes.join(', ') + '.';
    }

    // ----- Interface do validador -----

    // Confere o formulário inteiro. Devolve a lista de campos com problema (vazia = tudo certo).
    function validar() {
        const invalidos = [];
        regras.forEach(function (regra) {
            const el = elementoDe(regra);
            if (regra.valido(valorDe(regra, el), formEl)) {
                removerErro(regra, el);
            } else {
                mostrarErro(regra, el);
                invalidos.push(focoDe(regra, el));
            }
        });
        atualizarResumo();
        return invalidos;
    }

    // Erro que não vem de uma regra, e sim de uma resposta do "servidor"
    // (ex.: "este e-mail já está cadastrado"). Some quando a pessoa muda o campo.
    function erroDoServidor(id, nome, mensagem) {
        const el = document.getElementById(id);
        const recusado = el.value;
        const regra = { id: id, nome: nome, mensagem: mensagem, valido: valor => valor !== recusado };
        regrasExtras = regrasExtras.filter(r => r.id !== id).concat([regra]);
        mostrarErro(regra, el);
        atualizarResumo();
        el.focus();
    }

    // Enquanto a pessoa corrige, o erro de um campo some assim que ele fica certo
    // (ninguém quer ver "inválido" depois de já ter consertado).
    // Olhamos TODOS os campos com erro, e não só o que mudou: se a "senha" muda,
    // o erro de "confirmar senha" também pode ter sido resolvido.
    function revalidar() {
        regras.concat(regrasExtras).forEach(function (regra) {
            if (!temErro(regra)) {
                return;
            }
            const el = elementoDe(regra);
            if (regra.valido(valorDe(regra, el), formEl)) {
                removerErro(regra, el);
                regrasExtras = regrasExtras.filter(r => r !== regra);
            }
        });
        atualizarResumo();
    }

    formEl.addEventListener('input', revalidar);
    formEl.addEventListener('change', revalidar);

    return { validar: validar, erroDoServidor: erroDoServidor };
}

// ---------- 3) Estado "carregando" do botão ----------

// O botão NÃO usa "disabled": um botão desabilitado perde o foco do teclado.
// Com aria-disabled="true" ele continua focado e avisa os leitores de tela.
// aria-busy="true" liga o círculo girando (CSS). Quem chama diz o texto do botão e o que o leitor de tela fala.
function iniciarCarregamento(formEl, botaoEl, textoDoBotao, textoParaLeitor) {
    botaoEl.dataset.textoOriginal = botaoEl.textContent;
    botaoEl.setAttribute('aria-disabled', 'true');
    botaoEl.setAttribute('aria-busy', 'true');
    botaoEl.textContent = textoDoBotao;
    formEl.setAttribute('aria-busy', 'true');
    anunciar(textoParaLeitor);
}

function terminarCarregamento(formEl, botaoEl) {
    botaoEl.removeAttribute('aria-disabled');
    botaoEl.removeAttribute('aria-busy');
    if (botaoEl.dataset.textoOriginal) {
        botaoEl.textContent = botaoEl.dataset.textoOriginal;
    }
    formEl.removeAttribute('aria-busy');
}

// O botão está processando agora? (Serve para ignorar cliques repetidos.)
function estaCarregando(botaoEl) {
    return botaoEl.getAttribute('aria-busy') === 'true';
}
