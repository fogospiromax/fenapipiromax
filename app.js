import { brazilStates, campaign } from "./app-config.js";
import { formatPhone, hasCatalog, isValidPhone, prizeIndex } from "./logic.js";
import { leadStore } from "./storage.js";
import { wheelScene, playSpin, anticipation, celebrate, toggleSound, soundEnabled } from "./celebration.js";

const app = document.querySelector("#app");
let currentLead = null;
let selectedProfile = null;
let activationCode = null;
let spinning = false;
let operationUnlocked = false;

const profiles = {
  consumer: { icon: "🎉", title: "Consumidor final", subtitle: "Quero celebrar um bom momento." },
  professional: { icon: "🎆", title: "Pirotécnico / Shows", subtitle: "Faço eventos e espetáculos." },
  retailer: { icon: "🏪", title: "Lojista", subtitle: "Tenho loja ou revendo fogos." }
};
const profileName = (profile) => profiles[profile]?.title || profile;
const escape = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[char]));
const productImage = (prize) => prize.image ? `<img src="${prize.image}" alt="${escape(prize.shortName)}" style="width:65px;height:52px;object-fit:contain;mix-blend-mode:multiply" />` : `<span style="font-size:36px">${prize.icon}</span>`;
function actions() { app.querySelectorAll("[data-action]").forEach((element) => element.addEventListener("click", handleAction)); }

function shell(content, { compact = false, operation = false } = {}) {
  app.innerHTML = `<style>.brand{display:flex;gap:10px;align-items:center;min-height:42px}.brand img{width:120px;height:40px;object-fit:contain;object-position:left center}.brand small{font-size:9px;color:var(--muted);letter-spacing:.12em}.product-peek{display:flex;align-items:end;justify-content:center;height:80px;margin-top:12px;overflow:hidden;opacity:.82}.product-peek img{width:92px;height:95px;object-fit:contain;margin:0 -16px;filter:drop-shadow(0 6px 9px rgba(0,0,0,.4))}.lead-status select{max-width:145px;min-height:30px;padding:0 20px 0 7px;font-size:9px;background-position:calc(100% - 10px) 12px,calc(100% - 6px) 12px;background-size:4px 4px}</style><div class="spark spark-a"></div><div class="spark spark-b"></div><div class="spark spark-c"></div>
    <section class="screen ${compact ? "screen-compact" : ""}">
      <header class="brand"><img src="assets/logo-piromax-small.png" alt="Piromax Fogos" /><small>${operation ? "OPERAÇÃO · FENAPI" : "PASS · FENAPI"}</small></header>
      ${content}<footer><span>Seu momento começa aqui.</span></footer></section>`;
  actions();
  window.scrollTo(0, 0);
}

function renderWelcome() {
  currentLead = null; selectedProfile = null; activationCode = null;
  shell(`<div class="hero"><p class="eyebrow">BEM-VINDO À PIROMAX</p><h1>Viva a experiência.<br><em>Leve um momento.</em></h1><p class="intro">Selecione o perfil do visitante para iniciar o atendimento.</p></div>
    <div class="profile-list">${Object.entries(profiles).map(([id, item]) => `<button class="profile-card" data-action="choose-profile" data-profile="${id}"><span class="profile-icon">${item.icon}</span><span><strong>${item.title}</strong><small>${item.subtitle}</small></span><b>→</b></button>`).join("")}</div>`);
}

function renderConsumer() {
  shell(`<button class="back" data-action="home">← Voltar</button><div class="hero narrow"><p class="eyebrow">PIROMAX PASS</p><h1>Seu momento<br><em>começa aqui.</em></h1><p class="intro">Peça ao visitante para seguir @piromaxfogos e informe somente o primeiro nome.</p></div>
    <figure class="instagram-qr"><img src="assets/qr-instagram-piromax.png" alt="QR Code do Instagram da Piromax" /><figcaption>Aponte a câmera para seguir @piromaxfogos</figcaption></figure><form id="consumer-form"><label>Como podemos te chamar?<input name="name" autocomplete="given-name" required maxlength="50" placeholder="Primeiro nome" /></label><p id="consumer-error" class="form-error" hidden></p><button class="button secondary" type="submit">Conferi o Instagram · continuar</button></form><p class="microcopy">Consumidor final · somente o nome.</p>`);
  document.querySelector("#consumer-form").addEventListener("submit", prepareConsumer);
}

async function prepareConsumer(event) {
  event.preventDefault(); const form = event.currentTarget; const name = new FormData(form).get("name")?.trim();
  if (!name) return form.reportValidity();
  const button = form.querySelector("button"); button.disabled = true; button.textContent = "Preparando…";
  try { currentLead = await leadStore.createConsumer(name); renderWheel(); }
  catch { const error = document.querySelector("#consumer-error"); error.hidden = false; error.textContent = "Os copos destinados à ação estão esgotados."; button.disabled = false; button.textContent = "Conferi o Instagram · continuar"; }
}

function renderActivation() {
  shell(`<button class="back" data-action="home">← Voltar</button><div class="hero narrow"><p class="eyebrow">ATIVAÇÃO PIROMAX PASS</p><h1>Vamos começar<br><em>por aqui.</em></h1><p class="intro">Digite o código de ativação para este atendimento.</p></div><form id="activation-form"><label>Código de ativação<input id="activation-code" type="password" inputmode="numeric" autocomplete="one-time-code" maxlength="3" required /></label><p id="activation-error" class="form-error" hidden>Código inválido. Peça ajuda à equipe.</p><button class="button primary" type="submit">Continuar <span>→</span></button></form>`);
  document.querySelector("#activation-form").addEventListener("submit", async (event) => { event.preventDefault(); const code = document.querySelector("#activation-code").value; const button = event.currentTarget.querySelector("button"); button.disabled = true; button.textContent = "Verificando…"; const ok = campaign.activationCodes[code] && await leadStore.validateActivation(code); if (ok) { activationCode = code; renderB2bForm(); } else { const error = document.querySelector("#activation-error"); error.hidden = false; error.textContent = campaign.activationCodes[code] ? "Este código está indisponível porque o brinde esgotou." : "Código inválido. Peça ajuda à equipe."; button.disabled = false; button.textContent = "Continuar →"; } });
}

function renderB2bForm() {
  const label = selectedProfile === "retailer" ? "Nome da loja" : "Nome da empresa / show";
  shell(`<button class="back" data-action="home">← Voltar</button><div class="step-progress" aria-label="Progresso do cadastro"><i></i></div><p class="step-count"></p><div class="hero narrow form-title"><p class="eyebrow">PIROMAX PASS</p><h1>Vamos deixar seu<br><em>PASS pronto.</em></h1><p class="intro">Uma informação de cada vez.</p></div>
    <form id="lead-form" class="step-form" novalidate>
      <section class="form-step"><fieldset><legend>Você já é cliente Piromax?</legend><div class="choice-row"><label class="choice"><input type="radio" name="existingCustomer" value="yes" required /><span>Sim</span></label><label class="choice"><input type="radio" name="existingCustomer" value="no" required /><span>Ainda não</span></label></div></fieldset></section>
      <section class="form-step direct-question" hidden><fieldset><legend>Você já compra diretamente da Piromax?</legend><div class="choice-row"><label class="choice"><input type="radio" name="directCustomer" value="yes" required /><span>Sim</span></label><label class="choice"><input type="radio" name="directCustomer" value="no" required /><span>Não</span></label></div></fieldset></section>
      <section class="form-step" hidden><label>Como podemos te chamar?<input name="name" autocomplete="name" required maxlength="80" placeholder="Seu nome" /></label></section>
      <section class="form-step full-registration" hidden><label>Qual é o seu WhatsApp?<input name="phone" inputmode="tel" autocomplete="tel" required placeholder="(00) 00000-0000" /></label></section>
      <section class="form-step full-registration" hidden><label>Qual é a sua cidade?<input name="city" autocomplete="address-level2" required maxlength="80" placeholder="Cidade" /></label></section>
      <section class="form-step full-registration" hidden><label>Em qual estado?<select name="state" required><option value="">Selecione a UF</option>${brazilStates.map((state) => `<option value="${state}">${state}</option>`).join("")}</select></label></section>
      <section class="form-step" hidden><label>${label}<input name="company" autocomplete="organization" required maxlength="100" placeholder="${selectedProfile === "retailer" ? "Nome da loja" : "Empresa ou nome do show"}" /></label><p class="consent">Ao continuar, você concorda em receber contato da Piromax sobre produtos e atendimento comercial.</p></section>
      <p id="form-error" class="form-error" hidden></p><div class="step-actions"><button class="button secondary" id="step-back" type="button" hidden>Voltar</button><button class="button primary" id="step-next" type="button">Continuar <span>→</span></button><button class="button primary" id="step-submit" type="submit" hidden>Ativar meu PASS <span>→</span></button></div>
    </form>`, { compact: true });
  const form = document.querySelector("#lead-form");
  form.phone.addEventListener("input", (event) => { event.target.value = formatPhone(event.target.value); });
  form.addEventListener("submit", submitLead);
  const allSteps = [...form.querySelectorAll(".form-step")]; let step = 0; let steps = allSteps;
  const setPath = () => { const existing = form.querySelector("[name=existingCustomer]:checked")?.value; if (existing === "no") form.querySelector("[name=directCustomer][value=no]").checked = true; const direct = form.querySelector("[name=directCustomer]:checked")?.value === "yes"; steps = allSteps.filter(item => !(existing === "no" && item.classList.contains("direct-question")) && !(direct && item.classList.contains("full-registration"))); allSteps.filter(item => item.classList.contains("full-registration")).forEach(item => item.querySelectorAll("input,select").forEach(field => field.disabled = direct)); };
  const showStep = () => { setPath(); allSteps.forEach(item => item.hidden = true); steps[step].hidden = false; const radioStep = Boolean(steps[step].querySelector("input[type=radio]")); document.querySelector(".step-count").textContent = `${step + 1} de ${steps.length}`; document.querySelector(".step-progress i").style.width = `${(step + 1) / steps.length * 100}%`; form.querySelector("#step-back").hidden = step === 0; form.querySelector("#step-next").hidden = radioStep || step === steps.length - 1; form.querySelector("#step-submit").hidden = step !== steps.length - 1; steps[step].querySelector("input,select")?.focus(); };
  form.querySelector("#step-next").addEventListener("click", () => { const fields = [...steps[step].querySelectorAll("input,select:not(:disabled)")]; const valid = fields.some(field => field.type === "radio") ? fields.some(field => field.checked) : fields.every(field => field.checkValidity() && (field.name !== "phone" || isValidPhone(field.value))); if (!valid) { fields[0]?.reportValidity(); return; } step++; showStep(); });
  form.querySelectorAll("input[type=radio]").forEach((radio) => radio.addEventListener("change", () => { if (radio.name === "existingCustomer" && radio.value === "yes") form.querySelectorAll("[name=directCustomer]").forEach(item => item.checked = false); step++; showStep(); }));
  form.querySelector("#step-back").addEventListener("click", () => { if (step > 0) { step--; showStep(); } });
  showStep();
}

async function submitLead(event) {
  event.preventDefault(); const form = new FormData(event.currentTarget); const data = Object.fromEntries(form.entries()); const error = document.querySelector("#form-error");
  if (!event.currentTarget.checkValidity() || (data.directCustomer !== "yes" && !isValidPhone(data.phone))) { error.hidden = false; error.textContent = "Complete as informações solicitadas."; return; }
  data.profile = selectedProfile; data.catalog = hasCatalog(data); data.activationCode = activationCode;
  const button = event.currentTarget.querySelector("button[type=submit]"); button.disabled = true; button.textContent = "Ativando...";
  try { const result = await leadStore.createB2b(data); currentLead = result.record; result.duplicate ? renderDuplicate(currentLead) : renderPass(currentLead); }
  catch { error.hidden = false; error.textContent = "Este brinde acabou de esgotar. Volte e use outro código."; button.disabled = false; button.textContent = "Ativar meu PASS →"; }
}

function renderDuplicate(lead) {
  const action = lead.prize ? "Ver meu código" : "Continuar para a roda";
  shell(`<div class="hero narrow result"><p class="eyebrow">SEU PASS JÁ ESTÁ ATIVO</p><h1>Que bom ver você<br><em>por aqui de novo.</em></h1><p class="intro">Este WhatsApp já recebeu um PIROMAX PASS nesta ação. Cada participante pode girar uma vez.</p></div><div class="ticket-mini"><span>CÓDIGO</span><strong>${escape(lead.code)}</strong></div><button class="button primary" data-action="resume">${action} <span>→</span></button><button class="button secondary" data-action="home">Voltar ao início</button>`);
}

function renderPass(lead) {
  shell(`<div class="progress done"><i></i><i></i><i></i></div><div class="hero narrow result"><p class="eyebrow">PASS ATIVADO</p><h1>Pronto para<br><em>girar?</em></h1><p class="intro">Seu presente será revelado na Roda Piromax.</p></div><div class="ticket-mini pre-spin-code"><span>SEU CÓDIGO</span><strong>${escape(lead.code)}</strong></div><div class="spin-callout"><span>✦</span><div><strong>Agora é sua vez de girar.</strong><small>Guarde este código para a retirada.</small></div></div><button class="button primary" data-action="wheel">Ir para a roda <span>→</span></button>`, { compact: true });
}

function wheelMarkup() { return wheelScene(campaign.prizes); }

function renderWheel() {
  const consumer = currentLead?.consumer;
  shell(`<button class="back" data-action="pass">← Voltar</button><div class="hero narrow wheel-heading"><p class="eyebrow">RODA PIROMAX</p><h1>O que será que<br><em>vem?</em></h1><p class="intro">${consumer ? "Gire para revelar seu presente Piromax." : "Gire para revelar seu presente Piromax."}</p></div>${wheelMarkup()}<button type="button" class="sound-toggle" data-action="sound" aria-pressed="${soundEnabled()}">Som da revelação: ${soundEnabled() ? "ligado" : "desligado"}</button><button class="button primary spin-button" data-action="spin">Girar a roda <span>✦</span></button>`);
}

async function spinWheel() {
  if (spinning || !currentLead || currentLead.prize) return;
  spinning = true;
  const button = document.querySelector("[data-action='spin']");
  button.disabled = true; button.textContent = "Preparando seu momento…";
  app.querySelectorAll(".back").forEach(item => { item.disabled = true; });
  try {
    // Commit the result before animation so interruption never grants another spin.
    const record = await leadStore.saveSpin(currentLead.id);
    if (!record?.prize) throw new Error("Resultado indisponível");
    currentLead = record;
    button.textContent = "Seu presente está chegando…";
    await playSpin(document.querySelector(".wheel"), prizeIndex(record.prize.id), campaign.prizes.length);
    await anticipation();
    renderTicket(record, { consumer: record.consumer });
    celebrate();
    document.querySelector(".reveal-heading h1")?.focus();
  } catch {
    button.disabled = false; button.textContent = "Tentar novamente";
    app.querySelectorAll(".back").forEach(item => { item.disabled = false; });
    let error = app.querySelector(".spin-error");
    if (!error) { error = document.createElement("p"); error.className = "form-error spin-error"; error.setAttribute("role", "alert"); button.after(error); }
    error.textContent = "Não foi possível confirmar o presente. Tente novamente.";
  } finally { spinning = false; }
}

function renderTicket(lead, { consumer = false } = {}) {
  const prize = { ...lead.prize, ...campaign.prizes.find((item) => item.id === lead.prize.id) };
  const extra = lead.catalog ? '<div class="ticket-line"><span>+ catálogo Piromax</span><b>incluído</b></div>' : "";
  const bundle = consumer || prize.id === "cup" ? "Copo Piromax" : `Copo Piromax + ${escape(prize.shortName)}`;
  const visual = prize.video
    ? `<figure class="reveal-photo"><video src="${escape(prize.video)}" autoplay muted loop playsinline controls preload="metadata" aria-label="Apresentação 3D do copo Piromax"></video><figcaption>${escape(prize.name)}</figcaption></figure>`
    : prize.image
    ? `<figure class="reveal-photo"><img src="${escape(prize.image)}" alt="${escape(prize.name)}" /><figcaption>${escape(prize.name)}</figcaption></figure>`
    : `<figure class="reveal-photo no-photo"><span class="gift-symbol" aria-hidden="true">${prize.icon}</span><figcaption>${escape(prize.name)}</figcaption></figure>`;
  shell(`<div class="hero narrow reveal-heading"><p class="eyebrow">SEU PRESENTE PIROMAX</p><h1 tabindex="-1">Esse momento<br><em>vai com você.</em></h1><p class="intro">${prize.id === "cup" ? "Seu copo Piromax está aqui." : "Um copo e um presente especial para marcar sua visita."}</p></div>
    ${visual}
    ${prize.id !== "cup" ? '<div class="included-cup"><img src="assets/copo-piromax.png" alt="Copo Piromax incluído no presente" /><div><span>TAMBÉM É SEU</span><strong>+ 1 copo Piromax</strong></div></div>' : ""}
    <section class="ticket reveal-ticket" aria-label="Comprovante de retirada"><div class="ticket-top"><span>PIROMAX PASS · FENAPI</span><i>✦</i></div><div class="ticket-prize"><div><small>VOCÊ LEVA</small><strong>${bundle}</strong></div></div>${extra}<div class="ticket-code"><small>APRESENTE ESTE CÓDIGO À EQUIPE</small><strong>${escape(lead.code)}</strong></div><div class="ticket-bottom"><span>${escape(profileName(lead.profile))}</span><span>${consumer ? "Atendimento no stand" : lead.redeemedAt ? "Retirado" : "Aguardando retirada"}</span></div></section>
    <p class="reveal-note">${consumer ? "Entregue o copo ao visitante antes de iniciar o próximo atendimento." : "Confira os itens com o visitante e use o código para registrar a retirada na operação."}</p><button class="button secondary" data-action="home">Próximo visitante</button>`, { compact: true });
}

function renderOperationGate() {
  shell(`<div class="hero narrow result"><p class="eyebrow">EQUIPE PIROMAX</p><h1>Área de<br><em>operação.</em></h1><p class="intro">Use o PIN da equipe para acessar os leads e preparar os brindes.</p></div><form id="pin-form"><label>PIN de operação<input id="operation-pin" type="password" inputmode="numeric" autocomplete="off" required /></label><p class="form-error" id="pin-error" hidden>PIN incorreto.</p><button class="button primary" type="submit">Entrar</button></form>`, { operation: true });
  document.querySelector("#pin-form").addEventListener("submit", async (event) => { event.preventDefault(); const pin = document.querySelector("#operation-pin").value; if (await leadStore.verifyOperation(pin)) { operationUnlocked = true; renderAdmin(); } else document.querySelector("#pin-error").hidden = false; });
}

async function renderAdmin() {
  if (!operationUnlocked) { renderOperationGate(); return; }
  const [allLeads, inventory] = await Promise.all([leadStore.list(), leadStore.inventory()]); const leads = allLeads.filter((lead) => lead.profile !== "consumer"); leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const totals = { retailer: 0, professional: 0, consumer: 0, customers: 0, redeemed: 0 }; leads.forEach((lead) => { totals[lead.profile] = (totals[lead.profile] || 0) + 1; if (lead.existingCustomer === "yes") totals.customers += 1; if (lead.redeemedAt) totals.redeemed += 1; }); const b2bCount = (totals.retailer || 0) + (totals.professional || 0);
  shell(`<button class="back" data-action="leave-operation">← Sair da operação</button><div class="admin-head"><p class="eyebrow">OPERAÇÃO FENAPI</p><h1>Painel de leads</h1><p class="intro">Defina o prêmio de um PASS antes da pessoa girar. Esta escolha não aparece para o visitante.</p></div><div class="stats"><div><b>${leads.length}</b><span>Leads B2B</span></div><div><b>${totals.retailer || 0}</b><span>Lojistas</span></div><div><b>${totals.professional || 0}</b><span>Shows</span></div><div><b>${totals.redeemed}</b><span>Retirados</span></div></div><section class="inventory"><h2>Prêmios distribuídos</h2>${campaign.prizes.map((prize) => `<div><span>${prize.icon} ${prize.shortName}</span><b>${inventory[prize.id] || 0}${prize.stock !== null ? ` / ${prize.stock}` : ""}</b></div>`).join("")}</section><div class="admin-actions"><button class="button secondary" data-action="export">Baixar CSV</button><button class="button secondary" data-action="refresh">Atualizar</button></div><section class="lead-list"><h2>Leads e retirada</h2>${leads.length ? leads.map((lead) => `<article><div><strong>${escape(lead.name)}</strong><small>${escape(profileName(lead.profile))} · ${escape(lead.city)}/${escape(lead.state)}${lead.existingCustomer === "yes" ? " · Cliente" : ""}</small><small>${escape(lead.company)} · ${escape(lead.phone)}</small></div><div class="lead-status"><b>${escape(lead.code)}</b>${lead.prize ? `<span>${lead.prize.icon} ${escape(lead.prize.shortName)}</span>` : `<select data-assignment="${lead.id}" aria-label="Definir brinde para ${escape(lead.name)}"><option value="">Definir brinde</option>${campaign.prizes.map((prize) => `<option value="${prize.id}" ${lead.assignedPrize?.id === prize.id ? "selected" : ""}>${prize.icon} ${escape(prize.shortName)}</option>`).join("")}</select>`}${lead.redeemedAt ? `<em>Retirado</em>` : lead.prize ? `<button data-action="redeem" data-id="${lead.id}">Confirmar retirada</button>` : lead.assignedPrize ? `<em>Prêmio preparado</em>` : ""}</div></article>`).join("") : `<p class="empty">Ainda não há cadastros.</p>`}</section>`, { compact: true, operation: true });
  app.querySelectorAll("[data-assignment]").forEach((select) => select.addEventListener("change", async (event) => { if (event.target.value) { await leadStore.assignPrize(event.target.dataset.assignment, event.target.value); renderAdmin(); } }));
  const resetButton = document.createElement("button"); resetButton.className = "button danger"; resetButton.type = "button"; resetButton.textContent = "Apagar dados de teste"; resetButton.addEventListener("click", resetTestData); document.querySelector(".admin-actions").after(resetButton);
}

async function resetTestData() {
  if (!confirm("Apagar definitivamente todos os cadastros, giros e contadores de estoque desta ação?")) return;
  await leadStore.resetAll(); await renderAdmin();
}

async function downloadCsv() {
  const leads = (await leadStore.list()).filter((lead) => lead.profile !== "consumer"); const headings = ["Código", "Data", "Perfil", "Nome", "WhatsApp", "Cidade", "Estado", "Empresa", "Cliente Piromax", "Compra direto", "Catálogo", "Prêmio preparado", "Prêmio", "Giro", "Retirada"];
  const lines = leads.map((lead) => [lead.code, lead.createdAt, profileName(lead.profile), lead.name, lead.phone, lead.city, lead.state, lead.company, lead.existingCustomer === "yes" ? "Sim" : "Não", lead.directCustomer === "yes" ? "Sim" : "Não", lead.catalog ? "Sim" : "Não", lead.assignedPrize?.name || "", lead.prize?.name || "", lead.spunAt || "", lead.redeemedAt || ""]);
  const csv = [headings, ...lines].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n"); const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `piromax-pass-fenapi-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
}

async function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  if (action === "choose-profile") { selectedProfile = event.currentTarget.dataset.profile; selectedProfile === "consumer" ? renderConsumer() : renderActivation(); }
  if (action === "home") { window.location.hash = ""; renderWelcome(); }
  if (action === "wheel") renderWheel();
  if (action === "pass") currentLead?.consumer ? renderConsumer() : renderPass(currentLead);
  if (action === "spin") spinWheel();
  if (action === "sound") { const enabled = await toggleSound(); event.target.textContent = `Som da revelação: ${enabled ? "ligado" : "desligado"}`; event.target.setAttribute("aria-pressed", String(enabled)); }
  if (action === "resume") currentLead.prize ? renderTicket(currentLead) : renderPass(currentLead);
  if (action === "export") downloadCsv();
  if (action === "refresh") renderAdmin();
  if (action === "redeem") { await leadStore.markRedeemed(event.currentTarget.dataset.id); renderAdmin(); }
  if (action === "leave-operation") { operationUnlocked = false; window.location.hash = ""; renderWelcome(); }
}

window.addEventListener("hashchange", () => { if (window.location.hash === "#operacao") renderAdmin(); else renderWelcome(); });
window.location.hash === "#operacao" ? renderAdmin() : renderWelcome();
