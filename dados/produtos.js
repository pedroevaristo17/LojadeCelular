/* =========================================
   PRODUTOS: a lista de celulares da loja (lado do SERVIDOR)
   O servidor (index.js) usa esta lista para montar a página inicial e a página de cada produto.

   Etapa 2: o servidor lê a lista direto daqui.
   Etapa 3: esta lista vira a "carga inicial" do banco de dados: na primeira vez que o servidor
            sobe, ela é copiada para a coleção "products" do MongoDB.
   (Ainda existe uma cópia em public/js/produtos.js, usada pelo carrinho do navegador.
    Ela some na Etapa 4, quando o carrinho também passar para o servidor.)
========================================= */

// Garantia de todos os produtos (a home já diz: 12 meses de garantia em todos os smartphones).
const GARANTIA = '12 meses';

const PRODUTOS = [
    {
        id: 'galaxy-s26',
        nome: 'Galaxy S26',
        precoAntigo: 3999,
        preco: 3499,
        imagem: '/img/galaxy-s26.webp',
        largura: 668,
        altura: 808,
        alt: 'Smartphone Galaxy S26 na cor azul-clara, vista frontal e traseira',
        especificacoes: ['Tela 6,5" AMOLED', '256 GB de armazenamento', 'Câmera tripla 50 MP'],
        // Linhas da tabela "Especificações" da página do produto: [nome, valor]. A garantia é igual para todos e não fica aqui.
        ficha: [
            ['Tela', '6,5" AMOLED'],
            ['Armazenamento', '256 GB'],
            ['Câmera', 'Tripla, 50 MP'],
            ['Cor', 'Azul-claro']
        ]
    },
    {
        id: 'iphone-17',
        nome: 'iPhone 17',
        precoAntigo: 6499,
        preco: 5999,
        imagem: '/img/iphone-17.webp',
        largura: 967,
        altura: 1200,
        alt: 'Smartphone iPhone 17 na cor grafite, vista frontal e traseira',
        especificacoes: ['Tela 6,1" Super Retina', '128 GB de armazenamento', 'Câmera dupla 48 MP'],
        // Linhas da tabela "Especificações" da página do produto: [nome, valor]. A garantia é igual para todos e não fica aqui.
        ficha: [
            ['Tela', '6,1" Super Retina'],
            ['Armazenamento', '128 GB'],
            ['Câmera', 'Dupla, 48 MP'],
            ['Cor', 'Grafite']
        ]
    },
    {
        id: 'moto-edge-60',
        nome: 'Moto Edge 60',
        precoAntigo: 2799,
        preco: 2299,
        imagem: '/img/moto-edge-60.webp',
        largura: 1000,
        altura: 1000,
        alt: 'Smartphone Moto Edge 60 na cor dourada, vista frontal e traseira',
        especificacoes: ['Tela 6,7" OLED', '128 GB de armazenamento', 'Bateria de 5000 mAh'],
        // Linhas da tabela "Especificações" da página do produto: [nome, valor]. A garantia é igual para todos e não fica aqui.
        ficha: [
            ['Tela', '6,7" OLED'],
            ['Armazenamento', '128 GB'],
            ['Bateria', '5000 mAh'],
            ['Cor', 'Dourado']
        ]
    },
    {
        id: 'redmi-note-15',
        nome: 'Xiaomi Redmi Note 15',
        precoAntigo: 1899,
        preco: 1599,
        imagem: '/img/redmi-note-15.webp',
        largura: 960,
        altura: 1116,
        alt: 'Smartphone Xiaomi Redmi Note 15 na cor azul-arroxeada, vista frontal e traseira',
        especificacoes: ['Tela 6,6" AMOLED 120Hz', '256 GB de armazenamento', 'Carregamento rápido 67W'],
        // Linhas da tabela "Especificações" da página do produto: [nome, valor]. A garantia é igual para todos e não fica aqui.
        ficha: [
            ['Tela', '6,6" AMOLED, 120 Hz'],
            ['Armazenamento', '256 GB'],
            ['Carregamento', 'Rápido, 67 W'],
            ['Cor', 'Azul-arroxeado']
        ]
    },
    {
        id: 'galaxy-a56',
        nome: 'Galaxy A56',
        precoAntigo: 2199,
        preco: 1899,
        imagem: '/img/galaxy-a56.webp',
        largura: 1200,
        altura: 1200,
        alt: 'Smartphone Galaxy A56 na cor lilás, vista frontal e traseira',
        especificacoes: ['Tela 6,4" Super AMOLED', '128 GB de armazenamento', 'Câmera tripla 50 MP'],
        // Linhas da tabela "Especificações" da página do produto: [nome, valor]. A garantia é igual para todos e não fica aqui.
        ficha: [
            ['Tela', '6,4" Super AMOLED'],
            ['Armazenamento', '128 GB'],
            ['Câmera', 'Tripla, 50 MP'],
            ['Cor', 'Lilás']
        ]
    },
    {
        id: 'iphone-16e',
        nome: 'iPhone 16e',
        precoAntigo: 4799,
        preco: 4299,
        imagem: '/img/iphone-16e.webp',
        largura: 987,
        altura: 1200,
        alt: 'Smartphone iPhone 16e na cor branca, vista frontal e traseira',
        especificacoes: ['Tela 6,1" Liquid Retina', '128 GB de armazenamento', 'Chip A18'],
        // Linhas da tabela "Especificações" da página do produto: [nome, valor]. A garantia é igual para todos e não fica aqui.
        ficha: [
            ['Tela', '6,1" Liquid Retina'],
            ['Armazenamento', '128 GB'],
            ['Processador', 'Chip A18'],
            ['Cor', 'Branco']
        ]
    }
];

// module.exports diz o que este arquivo "entrega" para quem fizer require('./dados/produtos').
module.exports = { PRODUTOS, GARANTIA };
