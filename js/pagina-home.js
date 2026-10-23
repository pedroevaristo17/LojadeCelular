/* =========================================
   PÁGINA INICIAL: a busca do cabeçalho
   Só é carregado em index.html.
   Depende de loja.js (função anunciar), carregado antes.

   Antes, o botão "Buscar" recarregava a página e nada acontecia. Agora ele filtra os cartões
   da lista de ofertas, usando o nome e as especificações de cada celular.

   A busca fica guardada no endereço da página (index.html#busca=iphone). Por isso:
   - o botão "Voltar" do navegador desfaz a busca, e "Avançar" a refaz;
   - recarregar a página, ou voltar da tela de um produto, mostra o mesmo resultado;
   - clicar em "Smartphones" no menu (index.html#ofertas) volta para a lista completa.

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

const PREFIXO_BUSCA = 'busca=';

// O que a tela está mostrando agora. null = ainda não mostramos nada; '' = lista completa.
let termoAplicado = null;

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

// ---------- A busca no endereço da página ----------

// Lê a busca guardada no endereço: "#busca=iphone%2017" -> "iphone 17".
// Qualquer outro endereço (sem hash, "#ofertas"...) quer dizer "sem busca".
function termoDoEndereco() {
    const parte = location.hash.slice(1); // slice(1) tira o "#"
    if (!parte.startsWith(PREFIXO_BUSCA)) {
        return '';
    }
    try {
        return decodeURIComponent(parte.slice(PREFIXO_BUSCA.length));
    } catch (erro) {
        return ''; // endereço digitado errado (por exemplo, um "%" solto)
    }
}

// Põe na tela o resultado de um termo. Se a tela já mostra esse termo, não faz nada:
// assim o aviso para leitor de tela não é lido duas vezes.
function mostrarBusca(termo) {
    if (termo === termoAplicado) {
        return;
    }
    termoAplicado = termo;
    buscaCampoEl.value = termo;
    filtrar(termo);
}

function limparBusca() {
    mostrarBusca('');
    // "#ofertas" entra no histórico (o "Voltar" traz a busca de volta) e o navegador leva a tela até a lista.
    location.hash = 'ofertas';
    buscaCampoEl.focus();
}

// ---------- Ligar os eventos ----------

buscaFormEl.addEventListener('submit', function (evento) {
    evento.preventDefault(); // sem isto, o navegador recarregaria a página
    const termo = buscaCampoEl.value.trim();
    mostrarBusca(termo);
    // Muda o endereço, e isso cria um item no histórico: é o que faz o "Voltar" funcionar.
    // encodeURIComponent: "iphone 17" vira "iphone%2017", que cabe num endereço.
    location.hash = termo === '' ? 'ofertas' : PREFIXO_BUSCA + encodeURIComponent(termo);
    // Os resultados ficam mais abaixo na página: levamos a tela até eles, senão parece que nada aconteceu.
    document.getElementById('ofertas').scrollIntoView();
});

// Se a pessoa apagar tudo (ou clicar no "x" do campo de busca), a lista completa volta sozinha.
buscaCampoEl.addEventListener('input', function () {
    if (buscaCampoEl.value.trim() === '' && termoAplicado) {
        mostrarBusca('');
        // O endereço ainda diz "#busca=...": troca por "#ofertas" sem criar item no histórico e sem rolar a tela.
        try {
            history.replaceState(null, '', '#ofertas');
        } catch (erro) {
            // Sem problema: só o endereço fica desatualizado.
        }
    }
});

document.querySelectorAll('[data-busca-limpar]').forEach(function (botao) {
    botao.addEventListener('click', limparBusca);
});

// "Voltar" e "Avançar" do navegador (e clicar em "Smartphones" no menu) mudam só o final do endereço.
window.addEventListener('hashchange', function () {
    mostrarBusca(termoDoEndereco());
});

// Ao abrir a página (ou voltar para ela), mostra a busca que estiver no endereço.
window.addEventListener('pageshow', function () {
    mostrarBusca(termoDoEndereco());
});
mostrarBusca(termoDoEndereco());
