/**
 * Humorímetro — backend no Google Planilhas (Apps Script)
 *
 * Como usar:
 * 1. Crie uma planilha no Google Planilhas.
 * 2. Menu Extensões → Apps Script. Apague o que estiver lá e cole este arquivo inteiro.
 * 3. Salve. Clique em Implantar → Nova implantação → tipo "App da Web".
 *    - Executar como: Eu
 *    - Quem pode acessar: Qualquer pessoa
 * 4. Autorize, copie a URL que termina em /exec e cole em config.js no site.
 *
 * POST (site → planilha): grava uma linha na aba "Respostas".
 * GET  (site ← planilha): devolve a contagem de hoje e a geral, em JSON.
 */

const ABA = 'Respostas';
const HUMORES = ['bem', 'ok', 'triste', 'cansado'];

function aba_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ABA);
  if (!sh) {
    sh = ss.insertSheet(ABA);
    sh.appendRow(['Data/Hora', 'Humor', 'Nome', 'ID']);
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Evita que um nome como "=ALGO()" vire fórmula na planilha
function textoSeguro_(valor) {
  const s = String(valor || '').trim().slice(0, 40);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (HUMORES.indexOf(d.humor) === -1) return json_({ ok: false, erro: 'humor inválido' });

    const sh = aba_();
    const id = String(d.id || '');

    // Não grava duas vezes o mesmo envio (o site pode reenviar se ficou offline)
    if (id && sh.getLastRow() > 1) {
      const ids = sh.getRange(2, 4, sh.getLastRow() - 1, 1).getValues().map(function (l) { return String(l[0]); });
      if (ids.indexOf(id) !== -1) return json_({ ok: true, duplicado: true });
    }

    let quando = new Date(d.dataHora);
    if (isNaN(quando.getTime())) quando = new Date();

    sh.appendRow([quando, d.humor, textoSeguro_(d.nome), id]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  const sh = aba_();
  const tz = Session.getScriptTimeZone();
  const hoje = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const vazio = function () { return { bem: 0, ok: 0, triste: 0, cansado: 0, total: 0 }; };
  const res = { hoje: vazio(), geral: vazio() };

  if (sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (linha) {
      const dt = linha[0], humor = linha[1];
      if (HUMORES.indexOf(humor) === -1) return;
      res.geral[humor]++;
      res.geral.total++;
      if (dt instanceof Date && Utilities.formatDate(dt, tz, 'yyyy-MM-dd') === hoje) {
        res.hoje[humor]++;
        res.hoje.total++;
      }
    });
  }
  return json_(res);
}
