# Humorímetro

Versão digital (HTML + CSS + um pouco de JavaScript) da maquete física do humorímetro (`maquete.jpg`), usada para os alunos indicarem como estão se sentindo.

## Arquivos
- `index.html`: estrutura (título, os 4 quadrantes, ponteiro e a "massinha" no centro)
- `style.css`: cores da maquete, letras vazadas, carinhas, ponteiro, animações, botões e resumo
- `script.js`: botão Enviar, registros em JSON, envio para a planilha, contagem, baixar e limpar
- `config.js`: URL do App da Web do Google Apps Script (vazio = só local)
- `apps-script/Code.gs`: código para colar no Apps Script da planilha (backend)
- `maquete.jpg`: foto do modelo físico de referência

## Como funciona
- 4 humores: **BEM** (amarelo), **OK** (rosa), **TRISTE** (rosa) e **CANSADO** (amarelo), em grade 2x2 com título azul.
- Cada quadrante é um `<label>` ligado a um `<input type="radio">` escondido. Ao clicar, o ponteiro laranja gira do centro até o humor escolhido (seletor `:checked ~`), e uma mensagem aparece embaixo.
- As carinhas são SVG embutido no HTML.
- Responsivo (tamanhos com `clamp()`); dá para escolher pelo teclado (Tab + setas).
- Fonte: Gochi Hand (Google Fonts). Sem internet, usa uma fonte cursiva padrão.

## Registros (JSON)
- Escolha um humor, coloque o nome se quiser e clique em **Enviar**. O ponteiro volta ao início para o próximo aluno.
- Cada envio fica salvo no `localStorage` do navegador (chave `humorimetro_registros`) como uma lista JSON:
  ```json
  [{ "id": 1794613324392, "humor": "bem", "nome": "Ana", "dataHora": "2026-11-13T23:42:04.392Z" }]
  ```
  `humor` pode ser `bem`, `ok`, `triste` ou `cansado`; `nome` fica `null` quando não é preenchido.
- **Baixar JSON** gera o arquivo `humorimetro-AAAA-MM-DD.json`. **Limpar registros** apaga tudo (pede confirmação).
- Cada registro local tem também `sincronizado` (true quando já foi para a planilha).
- O GitHub Pages é estático, então para juntar as respostas de vários aparelhos usamos o **Google Planilhas** (abaixo). Sem `config.js` preenchido, tudo fica só no navegador.

## Planilha Google (guardar respostas de todos)
1. Crie uma planilha em https://sheets.new
2. **Extensões → Apps Script**: apague o conteúdo e cole `apps-script/Code.gs`. Salve.
3. **Implantar → Nova implantação → App da Web**. Executar como: **Eu**. Quem pode acessar: **Qualquer pessoa**. Autorize.
4. Copie a URL que termina em `/exec` e cole em `config.js` (`window.HUMORIMETRO_URL = "..."`). Faça commit/push.
- Cada envio vira uma linha na aba **Respostas** (Data/Hora, Humor, Nome, ID). IDs repetidos são ignorados.
- O GET da URL devolve `{ hoje: {...}, geral: {...} }`; o site mostra a contagem de **hoje** da turma.
- Sem internet: o envio fica pendente no navegador e é reenviado ao reabrir a página ou ao reconectar.
- Se alterar o `Code.gs`, use **Implantar → Gerenciar implantações → Editar → Nova versão** (mantém a mesma URL).

## Publicação
GitHub Pages: https://vitinimorrivel.github.io/humorimetro/ (branch `main`, raiz). Cada push na `main` atualiza o site.

## Como abrir
Abra o `index.html` no navegador, com `style.css` e `script.js` na mesma pasta.
