/* =========================================
   PÁGINA DE CONFIRMAÇÃO: mostra o pedido que acabou de ser finalizado
   Só é carregado em confirmacao.html.
   Depende de produtos.js, carrinho.js, loja.js e pedido.js, carregados antes.

   Dois estados:
   - existe um pedido guardado -> mostra os dados dele;
   - não existe (a pessoa abriu a página direto, sem comprar) -> mostra "Nenhum pedido encontrado".
========================================= */

const conteudoEl = document.querySelector('[data-confirmacao-conteudo]');
const vazioEl = document.querySelector('[data-confirmacao-vazio]');

// "Rua X, 123 - Apto 4 - Bairro, Cidade/UF - CEP 00000-000", sem deixar buracos se não houver complemento.
function montarEndereco(e) {
    // t() devolve '' no lugar de undefined, para nunca aparecer a palavra "undefined" na tela.
    const t = valor => (valor === undefined || valor === null) ? '' : String(valor);
    const rua = t(e.endereco) + ', ' + t(e.numero) + (e.complemento ? ' - ' + t(e.complemento) : '');
    return rua + ' - ' + t(e.bairro) + ', ' + t(e.cidade) + '/' + t(e.estado) + ' - CEP ' + t(e.cep);
}

// "23/10/2026 às 15:40". Se a data guardada estiver estragada, devolve texto vazio.
function montarData(texto) {
    const data = new Date(texto);
    if (isNaN(data.getTime())) {
        return '';
    }
    return 'Realizado em ' + data.toLocaleDateString('pt-BR') + ' às ' +
        data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function desenhar() {
    const pedido = lerPedido();

    conteudoEl.hidden = pedido === null;
    vazioEl.hidden = pedido !== null;
    if (pedido === null) {
        return;
    }

    // O nome e o endereço foram DIGITADOS pela pessoa. Por isso entram com escrever() (textContent),
    // que trata tudo como texto. Se alguém digitar "<script>" no nome, aparece escrito, sem executar.
    const primeiroNome = pedido.cliente.nome.trim().split(/\s+/)[0];
    // A vírgula entra junto com o nome: sem nome, o título fica "Obrigado pela sua compra!".
    escrever('data-pedido-nome', primeiroNome ? ', ' + primeiroNome : '');
    escrever('data-pedido-numero', pedido.numero);
    escrever('data-pedido-data', montarData(pedido.data));
    escrever('data-pedido-entrega', montarEndereco(pedido.endereco));
    escrever('data-pedido-pagamento', nomeDoPagamento(pedido.pagamento));

    desenharItensResumo(document.querySelector('[data-resumo-itens]'), pedido.itens);
    escrever('data-resumo-subtotal', formatarPreco(pedido.total));
    escrever('data-resumo-total', formatarPreco(pedido.total));
}

// ---------- Início ----------
desenhar();
