// Humorímetro
// - Cada envio é salvo como JSON no navegador (localStorage) — serve de backup.
// - Se config.js tiver a URL do Apps Script, o envio também vai para a planilha
//   e a contagem mostrada é a da turma inteira (hoje), vinda da planilha.
// - Envios feitos sem internet ficam pendentes e são reenviados depois.

const CHAVE = "humorimetro_registros";
const HUMORES = ["bem", "ok", "triste", "cansado"];
const URL_PLANILHA = (window.HUMORIMETRO_URL || "").trim();

const radios = document.querySelectorAll('input[name="humor"]');
const campoNome = document.getElementById("nome");
const botaoEnviar = document.getElementById("enviar");
const aviso = document.getElementById("aviso");
const tituloRegistros = document.getElementById("titulo-registros");
const fonte = document.getElementById("fonte");

/* ---------- armazenamento local ---------- */
function carregar() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE));
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

function salvar(registros) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(registros));
    return true;
  } catch {
    return false;
  }
}

/* ---------- planilha ---------- */
async function enviarParaPlanilha(registro) {
  // text/plain + no-cors: o Apps Script recebe sem precisar de CORS
  await fetch(URL_PLANILHA, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      id: registro.id,
      humor: registro.humor,
      nome: registro.nome,
      dataHora: registro.dataHora,
    }),
  });
}

let sincronizando = false;
async function sincronizarPendentes() {
  if (!URL_PLANILHA || sincronizando) return 0;
  sincronizando = true;
  let falhas = 0;
  try {
    for (const r of carregar().filter((r) => !r.sincronizado)) {
      try {
        await enviarParaPlanilha(r);
        const lista = carregar();
        const item = lista.find((x) => x.id === r.id);
        if (item) item.sincronizado = true;
        salvar(lista);
      } catch {
        falhas++;
      }
    }
  } finally {
    sincronizando = false;
  }
  return falhas;
}

async function buscarContagemPlanilha() {
  const resp = await fetch(URL_PLANILHA, { cache: "no-store" });
  if (!resp.ok) throw new Error("HTTP " + resp.status);
  const dados = await resp.json();
  if (!dados || !dados.hoje) throw new Error("resposta inválida");
  return dados.hoje;
}

/* ---------- tela ---------- */
function contagemLocal() {
  const registros = carregar();
  const c = { total: registros.length };
  HUMORES.forEach((h) => (c[h] = registros.filter((r) => r.humor === h).length));
  return c;
}

function mostrarContagem(c) {
  document.getElementById("total").textContent = c.total;
  HUMORES.forEach((h) => (document.getElementById("c-" + h).textContent = c[h] || 0));
}

async function atualizarResumo() {
  const pendentes = carregar().filter((r) => !r.sincronizado).length;

  if (!URL_PLANILHA) {
    tituloRegistros.textContent = "Registros neste aparelho";
    fonte.textContent = "Salvo só neste navegador.";
    mostrarContagem(contagemLocal());
    return;
  }

  try {
    mostrarContagem(await buscarContagemPlanilha());
    tituloRegistros.textContent = "Hoje na turma";
    fonte.textContent =
      "Dados da planilha." + (pendentes ? ` ${pendentes} envio(s) aguardando internet.` : "");
  } catch {
    tituloRegistros.textContent = "Registros neste aparelho";
    fonte.textContent =
      "Planilha indisponível agora; mostrando os dados deste aparelho." +
      (pendentes ? ` ${pendentes} envio(s) serão reenviados.` : "");
    mostrarContagem(contagemLocal());
  }
}

let timerAviso;
function mostrarAviso(texto) {
  aviso.textContent = texto;
  aviso.classList.add("visivel");
  clearTimeout(timerAviso);
  timerAviso = setTimeout(() => aviso.classList.remove("visivel"), 3000);
}

function humorEscolhido() {
  const marcado = document.querySelector('input[name="humor"]:checked');
  return marcado ? marcado.id : null;
}

/* ---------- eventos ---------- */
radios.forEach((r) =>
  r.addEventListener("change", () => (botaoEnviar.disabled = !humorEscolhido()))
);

botaoEnviar.addEventListener("click", async () => {
  const humor = humorEscolhido();
  if (!humor) return;

  const registros = carregar();
  registros.push({
    id: Date.now(),
    humor: humor,
    nome: campoNome.value.trim() || null,
    dataHora: new Date().toISOString(),
    sincronizado: false,
  });

  if (!salvar(registros)) {
    mostrarAviso("Não foi possível salvar neste navegador. 😕");
    return;
  }

  // Limpa para o próximo aluno
  radios.forEach((r) => (r.checked = false));
  campoNome.value = "";
  botaoEnviar.disabled = true;

  if (!URL_PLANILHA) {
    mostrarAviso("Humor registrado! Obrigado! ✅");
    atualizarResumo();
    return;
  }

  mostrarAviso("Enviando... ⏳");
  const falhas = await sincronizarPendentes();
  mostrarAviso(
    falhas
      ? "Sem internet: salvo aqui e será enviado depois. 📶"
      : "Humor registrado! Obrigado! ✅"
  );
  atualizarResumo();
});

document.getElementById("baixar").addEventListener("click", () => {
  const registros = carregar();
  const blob = new Blob([JSON.stringify(registros, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `humorimetro-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
});

document.getElementById("limpar").addEventListener("click", () => {
  const registros = carregar();
  if (!registros.length) return mostrarAviso("Não há registros para apagar.");
  const pendentes = registros.filter((r) => !r.sincronizado).length;
  const msg =
    "Apagar os registros salvos NESTE navegador?" +
    (URL_PLANILHA ? " (A planilha não é alterada.)" : " Baixe o JSON antes, se quiser guardar.") +
    (URL_PLANILHA && pendentes ? `\n\nAtenção: ${pendentes} envio(s) ainda não chegaram à planilha e serão perdidos.` : "");
  if (confirm(msg)) {
    salvar([]);
    atualizarResumo();
    mostrarAviso("Registros apagados deste navegador.");
  }
});

window.addEventListener("online", () => sincronizarPendentes().then(atualizarResumo));

sincronizarPendentes().then(atualizarResumo);
