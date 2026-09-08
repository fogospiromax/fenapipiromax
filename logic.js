import { campaign } from "./app-config.js";

export const normalizePhone = (value = "") => value.replace(/\D/g, "");

export function isValidPhone(value) {
  const digits = normalizePhone(value);
  return digits.length === 10 || digits.length === 11;
}

export function hasCatalog(lead) {
  if (campaign.catalogEligibility === "all_b2b") return true;
  if (campaign.catalogEligibility === "existing_customer_only") return lead.existingCustomer === "yes";
  return false;
}

export function createCode(profile) {
  const prefix = profile === "consumer" ? "PXC" : "PX";
  const seed = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${seed}-${String(Date.now()).slice(-4)}`;
}

export function availablePrizes(prizes, inventory = {}) {
  return prizes.filter((prize) => prize.stock === null || (inventory[prize.id] || 0) < prize.stock);
}

export function choosePrize(prizes, inventory = {}, random = Math.random) {
  const eligible = availablePrizes(prizes, inventory);
  if (!eligible.length) return campaign.prizes.find((prize) => prize.id === "cup");
  const total = eligible.reduce((sum, prize) => sum + prize.weight, 0);
  let position = random() * total;
  for (const prize of eligible) {
    position -= prize.weight;
    if (position < 0) return prize;
  }
  return eligible.at(-1);
}

export function prizeIndex(prizeId) {
  return campaign.prizes.findIndex((prize) => prize.id === prizeId);
}

export function formatPhone(value = "") {
  const digits = normalizePhone(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
