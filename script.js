// Humorímetro: registra cada envio num JSON salvo no navegador (localStorage)
// e permite baixar esse JSON como arquivo.

const CHAVE = "humorimetro_registros";
const HUMORES = ["bem", "ok", "triste", "cansado"];

const radios = document.querySelectorAll('input[name="humor"]');
const campoNome = document.getElementById("nome");
const botaoEnviar = document.getElementById("enviar");
const aviso = document.getElementById("aviso");

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

function humorEscolhido() {
  const marcado = document.querySelector('input[name="humor"]:checked');
  return marcado ? marcado.id : null;
}

function atualizarResumo() {
  const registros = carregar();
  document.getElementById("total").textContent = registros.length;
  HUMORES.forEach((h) => {
    document.getElementById("c-" + h).textContent =
      registros.filter((r) => r.humor === h).length;
  });
}

let timerAviso;
function mostrarAviso(texto) {
  aviso.textContent = texto;
  aviso.classList.add("visivel");
  clearTimeout(timerAviso);
  timerAviso = setTimeout(() => aviso.classList.remove("visivel"), 2500);
}

radios.forEach((r) =>
  r.addEventListener("change", () => (botaoEnviar.disabled = !humorEscolhido()))
);

botaoEnviar.addEventListener("click", () => {
  const humor = humorEscolhido();
  if (!humor) return;

  const registros = carregar();
  registros.push({
    id: Date.now(),
    humor: humor,
    nome: campoNome.value.trim() || null,
    dataHora: new Date().toISOString(),
  });

  if (!salvar(registros)) {
    mostrarAviso("Não foi possível salvar neste navegador. 😕");
    return;
  }

  // Limpa para o próximo aluno
  radios.forEach((r) => (r.checked = false));
  campoNome.value = "";
  botaoEnviar.disabled = true;
  atualizarResumo();
  mostrarAviso("Humor registrado! Obrigado! ✅");
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
  if (!carregar().length) return mostrarAviso("Não há registros para apagar.");
  if (confirm("Apagar todos os registros deste navegador? Baixe o JSON antes, se quiser guardar.")) {
    salvar([]);
    atualizarResumo();
    mostrarAviso("Registros apagados.");
  }
});

atualizarResumo();
