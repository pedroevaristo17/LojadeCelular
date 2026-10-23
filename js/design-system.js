/* =========================================
   DESIGN SYSTEM: lê os tokens do CSS e escreve na página
   Só é carregado em design-system.html.

   Faz duas coisas:
   1) preenche cada [data-valor="--nome-do-token"] com o valor que o CSS tem para aquele token;
   2) calcula o contraste de cada linha [data-contraste] da tabela, com a fórmula da WCAG 2.
   Assim a página mostra a verdade do CSS: se alguém mudar um token, o valor e o contraste mudam sozinhos.
========================================= */

// Lê o valor de um token. Exemplo: lerToken('--cor-primaria') -> '#0056b3'
function lerToken(nome) {
    return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
}

// ---------- Contraste (fórmula da WCAG 2) ----------

// Transforma '#0056b3' (ou '#05b') em [0, 86, 179]. Devolve null se não for uma cor em hexadecimal.
function hexParaRgb(hex) {
    let texto = hex.replace('#', '');
    if (texto.length === 3) {
        texto = texto.split('').map(letra => letra + letra).join('');
    }
    if (!/^[0-9a-fA-F]{6}$/.test(texto)) {
        return null;
    }
    return [0, 2, 4].map(inicio => parseInt(texto.slice(inicio, inicio + 2), 16));
}

// Luminância relativa: "quão clara" a cor parece para o olho humano (0 = preto, 1 = branco).
// O olho enxerga verde como mais claro que azul, por isso cada cor tem um peso diferente.
function luminancia(rgb) {
    const canais = rgb.map(function (valor) {
        const c = valor / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
}

// Razão de contraste entre duas cores, de 1 (iguais) a 21 (preto no branco).
function razaoDeContraste(hex1, hex2) {
    const rgb1 = hexParaRgb(hex1);
    const rgb2 = hexParaRgb(hex2);
    if (!rgb1 || !rgb2) {
        return null;
    }
    const l1 = luminancia(rgb1);
    const l2 = luminancia(rgb2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// 7.0589 -> '7,0:1'. Cortamos (e não arredondamos) para nunca mostrar "4,5" quando o real é 4,49.
function formatarRazao(razao) {
    return (Math.floor(razao * 10) / 10).toFixed(1).replace('.', ',') + ':1';
}

// ---------- Preencher a página ----------

function preencherValores() {
    document.querySelectorAll('[data-valor]').forEach(function (elemento) {
        const valor = lerToken(elemento.dataset.valor);
        // Para tamanhos em rem, mostramos também os pixels (1rem = 16px no navegador padrão).
        const pixels = /^[0-9.]+rem$/.test(valor) ? ' (' + Math.round(parseFloat(valor) * 16) + ' px)' : '';
        elemento.textContent = valor + pixels;
    });
}

function preencherContrastes() {
    document.querySelectorAll('[data-contraste]').forEach(function (linha) {
        const corTexto = lerToken(linha.dataset.texto);
        const corFundo = lerToken(linha.dataset.fundo);
        const minimo = Number(linha.dataset.minimo);
        const razao = razaoDeContraste(corTexto, corFundo);

        // A amostra "Aa" usa as duas cores de verdade.
        const amostra = linha.querySelector('.ds-par');
        amostra.style.color = corTexto;
        amostra.style.backgroundColor = corFundo;

        const razaoEl = linha.querySelector('[data-razao]');
        const resultadoEl = linha.querySelector('[data-resultado]');

        if (razao === null) {
            razaoEl.textContent = 'não calculado';
            resultadoEl.textContent = '—';
            return;
        }

        razaoEl.textContent = formatarRazao(razao);
        const passou = razao >= minimo;
        // O resultado tem texto e símbolo (✓ ou ✗), não só cor.
        resultadoEl.textContent = passou ? '✓ Aprovado' : '✗ Reprovado';
        resultadoEl.className = passou ? 'ds-ok' : 'ds-falha';
    });
}

// ---------- Início ----------
// Como o script tem "defer", o HTML já está pronto quando chegamos aqui.
preencherValores();
preencherContrastes();
