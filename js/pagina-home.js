/* =========================================
   PÁGINA INICIAL: a busca do cabeçalho
   Só é carregado em index.html.
   Depende de loja.js (função anunciar), carregado antes.

   Antes, o botão "Buscar" recarregava a página e nada acontecia. Agora ele filtra os cartões
   da lista de ofertas, usando o nome e as especificações de cada celular.

   Estados:
   - RESULTADO -> "2 celulares encontrados para "iphone"" + botão "Limpar busca";
   - VAZIO     -> caixa "Nenhum celular encontrado" com botão para ver todos de novo.
========================================= */

const buscaFormEl = document.querySelector('.busca');
const buscaCampoEl = document.getElementById('busca');
const cartoesEl = Array.from(document.querySelectorAll('.ofertas .produto'));
const resultadoEl = document.querySelector('[data-busca-resultado]');
const resultadoTextoEl = document.querySelector('[data-busca-texto]');
const vazioEl = document.querySelector('[data-busca-vazio]');

// Tira acentos e maiúsculas, para "Câmera" e "camera" serem a mesma busca.
// normalize('NFD') separa a letra do acento; o replace apaga só os acentos.
function normalizar(texto) {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// Mostra só os cartões que combinam com o que foi digitado. Devolve quantos combinaram.
// Cada palavra digitada precisa aparecer no cartão: "iphone 17" acha o iPhone 17, mas não o 16e.
function filtrar(termoDigitado) {
    const palavras = normalizar(termoDigitado).split(/\s+/).filter(Boolean);
    let achados = 0;

    cartoesEl.forEach(function (cartao) {
        const texto = normalizar(cartao.querySelector('h3').textContent + ' ' +
            cartao.querySelector('.especificacoes').textContent);
        const combina = palavras.every(palavra => texto.includes(palavra));
        cartao.hidden = !combina;
        if (combina) {
            achados++;
        }
    });

    const buscando = palavras.length > 0;
    const termo = termoDigitado.trim();

    resultadoEl.hidden = !(buscando && achados > 0);
    vazioEl.hidden = !(buscando && achados === 0);

    if (buscando && achados > 0) {
        // textContent: o que a pessoa digitou entra como texto puro, nunca como HTML.
        resultadoTextoEl.textContent = achados + (achados === 1 ? ' celular encontrado' : ' celulares encontrados') +
            ' para “' + termo + '”.';
        anunciar(resultadoTextoEl.textContent);
    } else if (buscando) {
        anunciar('Nenhum celular encontrado para “' + termo + '”.');
    }

    return achados;
}

function limparBusca() {
    buscaCampoEl.value = '';
    filtrar('');
    buscaCampoEl.focus();
}

// ---------- Ligar os eventos ----------

buscaFormEl.addEventListener('submit', function (evento) {
    evento.preventDefault(); // sem isto, o navegador recarregaria a página
    filtrar(buscaCampoEl.value);
    // Os resultados ficam mais abaixo na página: levamos a tela até eles, senão parece que nada aconteceu.
    document.getElementById('ofertas').scrollIntoView();
});

// Se a pessoa apagar tudo (ou clicar no "x" do campo de busca), a lista completa volta sozinha.
buscaCampoEl.addEventListener('input', function () {
    if (buscaCampoEl.value.trim() === '') {
        filtrar('');
    }
});

document.querySelectorAll('[data-busca-limpar]').forEach(function (botao) {
    botao.addEventListener('click', limparBusca);
});

// Voltar com o botão "Voltar" do navegador pode trazer o campo com texto antigo: refiltra.
window.addEventListener('pageshow', function () {
    filtrar(buscaCampoEl.value);
});
