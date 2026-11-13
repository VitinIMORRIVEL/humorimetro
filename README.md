# Humorímetro

Versão digital (HTML + CSS, sem JavaScript) da maquete física do humorímetro (`maquete.jpg`), usada para os alunos indicarem como estão se sentindo.

## Arquivos
- `index.html`: estrutura (título, os 4 quadrantes, ponteiro e a "massinha" no centro)
- `style.css`: cores da maquete, letras vazadas, carinhas, ponteiro e animações
- `maquete.jpg`: foto do modelo físico de referência

## Como funciona
- 4 humores: **BEM** (amarelo), **OK** (rosa), **TRISTE** (rosa) e **CANSADO** (amarelo), em grade 2x2 com título azul.
- Cada quadrante é um `<label>` ligado a um `<input type="radio">` escondido. Ao clicar, o ponteiro laranja gira do centro até o humor escolhido (seletor `:checked ~`), e uma mensagem aparece embaixo.
- As carinhas são SVG embutido no HTML.
- Responsivo (tamanhos com `clamp()`); dá para escolher pelo teclado (Tab + setas).
- Fonte: Gochi Hand (Google Fonts). Sem internet, usa uma fonte cursiva padrão.

## Como abrir
Abra o `index.html` no navegador, com o `style.css` na mesma pasta.
