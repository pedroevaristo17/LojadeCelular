/* =========================================
   PRODUTOS: a lista oficial da loja
   Todas as páginas leem os dados daqui. Se um preço mudar,
   muda num lugar só (e não em cada página).
========================================= */

// "const" cria uma variável que não pode ser trocada por outra coisa.
// [ ... ] é uma lista (array). Cada { ... } é um objeto: um grupo de pares "nome: valor".
const PRODUTOS = [
    {
        id: 'galaxy-s26',
        nome: 'Galaxy S26',
        precoAntigo: 3999,
        preco: 3499,
        imagem: 'img/galaxy-s26.webp',
        largura: 668,
        altura: 808,
        alt: 'Smartphone Galaxy S26 na cor azul-clara, vista frontal e traseira',
        especificacoes: ['Tela 6,5" AMOLED', '256 GB de armazenamento', 'Câmera tripla 50 MP']
    },
    {
        id: 'iphone-17',
        nome: 'iPhone 17',
        precoAntigo: 6499,
        preco: 5999,
        imagem: 'img/iphone-17.webp',
        largura: 967,
        altura: 1200,
        alt: 'Smartphone iPhone 17 na cor grafite, vista frontal e traseira',
        especificacoes: ['Tela 6,1" Super Retina', '128 GB de armazenamento', 'Câmera dupla 48 MP']
    },
    {
        id: 'moto-edge-60',
        nome: 'Moto Edge 60',
        precoAntigo: 2799,
        preco: 2299,
        imagem: 'img/moto-edge-60.webp',
        largura: 1000,
        altura: 1000,
        alt: 'Smartphone Moto Edge 60 na cor dourada, vista frontal e traseira',
        especificacoes: ['Tela 6,7" OLED', '128 GB de armazenamento', 'Bateria de 5000 mAh']
    },
    {
        id: 'redmi-note-15',
        nome: 'Xiaomi Redmi Note 15',
        precoAntigo: 1899,
        preco: 1599,
        imagem: 'img/redmi-note-15.webp',
        largura: 960,
        altura: 1116,
        alt: 'Smartphone Xiaomi Redmi Note 15 na cor azul-arroxeada, vista frontal e traseira',
        especificacoes: ['Tela 6,6" AMOLED 120Hz', '256 GB de armazenamento', 'Carregamento rápido 67W']
    },
    {
        id: 'galaxy-a56',
        nome: 'Galaxy A56',
        precoAntigo: 2199,
        preco: 1899,
        imagem: 'img/galaxy-a56.webp',
        largura: 1200,
        altura: 1200,
        alt: 'Smartphone Galaxy A56 na cor lilás, vista frontal e traseira',
        especificacoes: ['Tela 6,4" Super AMOLED', '128 GB de armazenamento', 'Câmera tripla 50 MP']
    },
    {
        id: 'iphone-16e',
        nome: 'iPhone 16e',
        precoAntigo: 4799,
        preco: 4299,
        imagem: 'img/iphone-16e.webp',
        largura: 987,
        altura: 1200,
        alt: 'Smartphone iPhone 16e na cor branca, vista frontal e traseira',
        especificacoes: ['Tela 6,1" Liquid Retina', '128 GB de armazenamento', 'Chip A18']
    }
];

// Procura um produto pelo id. Devolve o produto, ou undefined se não existir.
// "p => p.id === id" é uma função curta (arrow function): "para cada produto p, teste se p.id é igual a id".
function buscarProduto(id) {
    return PRODUTOS.find(p => p.id === id);
}
