import { brazilStates, campaign } from "./app-config.js";
import { createCode, formatPhone, hasCatalog, isValidPhone, prizeIndex } from "./logic.js";
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
    <div class="profile-list">${Object.entries(profiles).map(([id, item]) => `<button class="profile-card" data-action="choose-profile" data-profile="${id}"><span class="profile-icon">${item.icon}</span><span><strong>${item.title}</strong><small>${item.subtitle}</small></span><b>→</b></button>`).join("")}</div>
    <div class="product-peek"><img src="assets/caneca-piromax-small.png" alt="Caneca Piromax" /><img src="assets/camiseta-branca-piromax-small.png" alt="Camiseta Piromax" /><img src="assets/camiseta-preta-piromax-small.png" alt="Camiseta Piromax" /></div>`);
}

function renderConsumer() {
  shell(`<button class="back" data-action="home">← Voltar</button><div class="hero narrow"><p class="eyebrow">PIROMAX PASS</p><h1>Seu momento<br><em>começa aqui.</em></h1><p class="intro">Peça ao visitante para seguir @piromaxfogos no celular dele. Confira antes de liberar a rodada.</p></div>
    <a class="button primary instagram" href="${campaign.instagramUrl}" target="_blank" rel="noopener">Seguir @piromaxfogos <span>↗</span></a><button class="button secondary" data-action="consumer-confirm">Conferi o Instagram · continuar</button><p class="microcopy">Consumidor final · atendimento sem cadastro.</p>`);
}

function prepareConsumer() {
  currentLead = { id: `consumer-${Date.now()}`, code: createCode("consumer"), profile: "consumer", consumer: true, prize: null, catalog: false, createdAt: new Date().toISOString() };
  renderWheel();
}

function renderActivation() {
  shell(`<button class="back" data-action="home">← Voltar</button><div class="hero narrow"><p class="eyebrow">ATIVAÇÃO PIROMAX PASS</p><h1>Vamos começar<br><em>por aqui.</em></h1><p class="intro">Digite o código de ativação para este atendimento.</p></div><form id="activation-form"><label>Código de ativação<input id="activation-code" type="password" inputmode="numeric" autocomplete="one-time-code" maxlength="3" required /></label><p id="activation-error" class="form-error" hidden>Código inválido. Peça ajuda à equipe.</p><button class="button primary" type="submit">Continuar <span>→</span></button></form>`);
  document.querySelector("#activation-form").addEventListener("submit", (event) => { event.preventDefault(); const code = document.querySelector("#activation-code").value; if (campaign.activationCodes[code]) { activationCode = code; renderB2bForm(); } else document.querySelector("#activation-error").hidden = false; });
}

function renderB2bForm() {
  const label = selectedProfile === "retailer" ? "Nome da loja" : "Nome da empresa / show";
  shell(`<button class="back" data-action="home">← Voltar</button><div class="progress"><i></i><i></i><i></i></div><div class="hero narrow form-title"><p class="eyebrow">PIROMAX PASS</p><h1>Vamos deixar seu<br><em>PASS pronto.</em></h1><p class="intro">Preencha os dados do visitante atendido.</p></div>
    <form id="lead-form" novalidate><label>Como podemos te chamar?<input name="name" autocomplete="name" required maxlength="80" placeholder="Seu nome" /></label><label>Seu WhatsApp<input name="phone" inputmode="tel" autocomplete="tel" required placeholder="(00) 00000-0000" /></label><div class="two-columns"><label>Sua cidade<input name="city" autocomplete="address-level2" required maxlength="80" placeholder="Cidade" /></label><label>Estado<select name="state" required><option value="">UF</option>${brazilStates.map((state) => `<option value="${state}">${state}</option>`).join("")}</select></label></div><label>${label}<input name="company" autocomplete="organization" required maxlength="100" placeholder="${selectedProfile === "retailer" ? "Nome da loja" : "Empresa ou nome do show"}" /></label><fieldset><legend>Você já é cliente Piromax?</legend><div class="choice-row"><label class="choice"><input type="radio" name="existingCustomer" value="yes" required /><span>Sim</span></label><label class="choice"><input type="radio" name="existingCustomer" value="no" required /><span>Ainda não</span></label></div></fieldset><p id="form-error" class="form-error" hidden></p><button class="button primary" type="submit">Ativar meu PASS <span>→</span></button><p class="consent">Ao continuar, você concorda em receber contato da Piromax sobre produtos e atendimento comercial.</p></form>`, { compact: true });
  const form = document.querySelector("#lead-form");
  form.phone.addEventListener("input", (event) => { event.target.value = formatPhone(event.target.value); });
  form.addEventListener("submit", submitLead);
}

async function submitLead(event) {
  event.preventDefault(); const form = new FormData(event.currentTarget); const data = Object.fromEntries(form.entries()); const error = document.querySelector("#form-error");
  if (!event.currentTarget.checkValidity() || !isValidPhone(data.phone)) { error.hidden = false; error.textContent = "Complete todos os campos com um WhatsApp válido."; return; }
  data.profile = selectedProfile; data.catalog = hasCatalog(data); data.activationCode = activationCode;
  const button = event.currentTarget.querySelector("button[type=submit]"); button.disabled = true; button.textContent = "Ativando...";
  const result = await leadStore.createB2b(data); currentLead = result.record;
  result.duplicate ? renderDuplicate(currentLead) : renderPass(currentLead);
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
    const record = currentLead.consumer
      ? { ...currentLead, prize: campaign.prizes.find(prize => prize.id === "cup") }
      : await leadStore.saveSpin(currentLead.id);
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
  const [leads, inventory] = await Promise.all([leadStore.list(), leadStore.inventory()]); leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const totals = { retailer: 0, professional: 0, customers: 0, redeemed: 0 }; leads.forEach((lead) => { totals[lead.profile] = (totals[lead.profile] || 0) + 1; if (lead.existingCustomer === "yes") totals.customers += 1; if (lead.redeemedAt) totals.redeemed += 1; });
  shell(`<button class="back" data-action="leave-operation">← Sair da operação</button><div class="admin-head"><p class="eyebrow">OPERAÇÃO FENAPI</p><h1>Painel de leads</h1><p class="intro">Defina o prêmio de um PASS antes da pessoa girar. Esta escolha não aparece para o visitante.</p></div><div class="stats"><div><b>${leads.length}</b><span>Leads B2B</span></div><div><b>${totals.retailer || 0}</b><span>Lojistas</span></div><div><b>${totals.professional || 0}</b><span>Shows</span></div><div><b>${totals.redeemed}</b><span>Retirados</span></div></div><section class="inventory"><h2>Prêmios distribuídos</h2>${campaign.prizes.map((prize) => `<div><span>${prize.icon} ${prize.shortName}</span><b>${inventory[prize.id] || 0}${prize.stock !== null ? ` / ${prize.stock}` : ""}</b></div>`).join("")}</section><div class="admin-actions"><button class="button secondary" data-action="export">Baixar CSV</button><button class="button secondary" data-action="refresh">Atualizar</button></div><section class="lead-list"><h2>Leads e retirada</h2>${leads.length ? leads.map((lead) => `<article><div><strong>${escape(lead.name)}</strong><small>${escape(profileName(lead.profile))} · ${escape(lead.city)}/${escape(lead.state)}${lead.existingCustomer === "yes" ? " · Cliente" : ""}</small><small>${escape(lead.company)} · ${escape(lead.phone)}</small></div><div class="lead-status"><b>${escape(lead.code)}</b>${lead.prize ? `<span>${lead.prize.icon} ${escape(lead.prize.shortName)}</span>` : `<select data-assignment="${lead.id}" aria-label="Definir brinde para ${escape(lead.name)}"><option value="">Definir brinde</option>${campaign.prizes.map((prize) => `<option value="${prize.id}" ${lead.assignedPrize?.id === prize.id ? "selected" : ""}>${prize.icon} ${escape(prize.shortName)}</option>`).join("")}</select>`}${lead.redeemedAt ? `<em>Retirado</em>` : lead.prize ? `<button data-action="redeem" data-id="${lead.id}">Confirmar retirada</button>` : lead.assignedPrize ? `<em>Prêmio preparado</em>` : ""}</div></article>`).join("") : `<p class="empty">Ainda não há cadastros.</p>`}</section>`, { compact: true, operation: true });
  app.querySelectorAll("[data-assignment]").forEach((select) => select.addEventListener("change", async (event) => { if (event.target.value) { await leadStore.assignPrize(event.target.dataset.assignment, event.target.value); renderAdmin(); } }));
}

async function downloadCsv() {
  const leads = await leadStore.list(); const headings = ["Código", "Data", "Perfil", "Nome", "WhatsApp", "Cidade", "Estado", "Empresa", "Cliente Piromax", "Catálogo", "Prêmio preparado", "Prêmio", "Giro", "Retirada"];
  const lines = leads.map((lead) => [lead.code, lead.createdAt, profileName(lead.profile), lead.name, lead.phone, lead.city, lead.state, lead.company, lead.existingCustomer === "yes" ? "Sim" : "Não", lead.catalog ? "Sim" : "Não", lead.assignedPrize?.name || "", lead.prize?.name || "", lead.spunAt || "", lead.redeemedAt || ""]);
  const csv = [headings, ...lines].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n"); const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `piromax-pass-fenapi-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
}

async function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  if (action === "choose-profile") { selectedProfile = event.currentTarget.dataset.profile; selectedProfile === "consumer" ? renderConsumer() : renderActivation(); }
  if (action === "home") { window.location.hash = ""; renderWelcome(); }
  if (action === "consumer-confirm") prepareConsumer();
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
