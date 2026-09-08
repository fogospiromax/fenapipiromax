import { campaign } from "./app-config.js";
import { choosePrize, createCode, normalizePhone } from "./logic.js";

const KEYS = {
  leads: `piromax-pass:${campaign.id}:leads`,
  inventory: `piromax-pass:${campaign.id}:inventory`
};

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export const localStore = {
  isRemote: () => false,
  list: () => read(KEYS.leads, []),
  inventory: () => read(KEYS.inventory, {}),
  findByPhone(phone) {
    const normalized = normalizePhone(phone);
    return this.list().find((lead) => lead.phoneNormalized === normalized);
  },
  createB2b(data) {
    const duplicate = this.findByPhone(data.phone);
    if (duplicate) return { record: duplicate, duplicate: true };
    const record = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      code: createCode(data.profile),
      profile: data.profile,
      name: data.name.trim(),
      phone: data.phone.trim(),
      phoneNormalized: normalizePhone(data.phone),
      city: data.city.trim(),
      state: data.state,
      company: data.company.trim(),
      existingCustomer: data.existingCustomer,
      catalog: false,
      assignedPrize: campaign.activationCodes?.[data.activationCode] ? campaign.prizes.find((prize) => prize.id === campaign.activationCodes[data.activationCode]) : null,
      prize: null,
      spunAt: null,
      redeemedAt: null,
      createdAt: new Date().toISOString(),
      source: campaign.id
    };
    record.catalog = data.catalog;
    const leads = this.list();
    leads.push(record);
    write(KEYS.leads, leads);
    return { record, duplicate: false };
  },
  createConsumer() {
    return {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      code: createCode("consumer"),
      profile: "consumer",
      prize: { id: "cup", name: "Copo Piromax", shortName: "Copo Piromax", icon: "🥤" },
      catalog: false,
      createdAt: new Date().toISOString()
    };
  },
  saveSpin(id, prize) {
    const leads = this.list();
    const index = leads.findIndex((lead) => lead.id === id);
    if (index === -1 || leads[index].prize) return leads[index] || null;
    const selectedPrize = prize || leads[index].assignedPrize || choosePrize(campaign.prizes, this.inventory());
    leads[index].prize = selectedPrize;
    leads[index].spunAt = new Date().toISOString();
    const inventory = this.inventory();
    inventory[selectedPrize.id] = (inventory[selectedPrize.id] || 0) + 1;
    write(KEYS.leads, leads);
    write(KEYS.inventory, inventory);
    return leads[index];
  },
  assignPrize(id, prizeId) {
    const leads = this.list();
    const index = leads.findIndex((lead) => lead.id === id);
    if (index < 0 || leads[index].prize) return leads[index] || null;
    leads[index].assignedPrize = campaign.prizes.find((prize) => prize.id === prizeId) || null;
    write(KEYS.leads, leads);
    return leads[index];
  },
  markRedeemed(id) {
    const leads = this.list();
    const index = leads.findIndex((lead) => lead.id === id);
    if (index < 0) return null;
    leads[index].redeemedAt = leads[index].redeemedAt || new Date().toISOString();
    write(KEYS.leads, leads);
    return leads[index];
  },
  reset() { localStorage.removeItem(KEYS.leads); localStorage.removeItem(KEYS.inventory); }
};

/**
 * Contrato sugerido para backend:
 * POST /leads -> lead; POST /leads/:id/spin -> lead já premiado (atômico);
 * PATCH /leads/:id/redeem -> lead; GET /leads -> leads + inventory.
 * Substitua este adaptador por chamadas autenticadas quando a API existir.
 */
async function request(path, options = {}) {
  const response = await fetch(`${campaign.api.baseUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...(campaign.api.adminToken ? { "X-Operation-Token": campaign.api.adminToken } : {}), ...options.headers },
    ...options
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

export const leadStore = {
  operationPin: "",
  setOperationPin(pin) { this.operationPin = pin; },
  async verifyOperation(pin) {
    this.operationPin = pin;
    try { return (await request("/admin/check", { headers: { "X-Operation-Pin": pin } })).ok; }
    catch { return pin === campaign.operationPin; }
  },
  async list() { try { return (await request("/leads", { headers: { "X-Operation-Pin": this.operationPin } })).leads; } catch { return localStore.list(); } },
  async inventory() { try { return (await request("/leads", { headers: { "X-Operation-Pin": this.operationPin } })).inventory; } catch { return localStore.inventory(); } },
  async createB2b(data) { try { return await request("/leads", { method: "POST", body: JSON.stringify(data) }); } catch { return localStore.createB2b(data); } },
  async prepareSpin(id) {
    try { return (await request(`/leads/${id}/prepare`, { method: "POST" })).record.assignedPrize; }
    catch {
      const lead = localStore.list().find((item) => item.id === id);
      if (!lead) return campaign.prizes.find((prize) => prize.id === "cup");
      if (!lead.assignedPrize) localStore.assignPrize(id, choosePrize(campaign.prizes, localStore.inventory()).id);
      return localStore.list().find((item) => item.id === id).assignedPrize;
    }
  },
  async saveSpin(id) { try { return (await request(`/leads/${id}/spin`, { method: "POST" })).record; } catch { return localStore.saveSpin(id); } },
  async assignPrize(id, prizeId) { try { return (await request(`/leads/${id}/assignment`, { method: "PATCH", headers: { "X-Operation-Pin": this.operationPin }, body: JSON.stringify({ prizeId }) })).record; } catch { return localStore.assignPrize(id, prizeId); } },
  async markRedeemed(id) { try { return (await request(`/leads/${id}/redeem`, { method: "PATCH", headers: { "X-Operation-Pin": this.operationPin } })).record; } catch { return localStore.markRedeemed(id); } },
  reset() { return localStore.reset(); }
};
