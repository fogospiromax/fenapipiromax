import test from "node:test";
import assert from "node:assert/strict";
import { campaign } from "../app-config.js";
import { choosePrize, formatPhone, hasCatalog, isValidPhone, normalizePhone } from "../logic.js";

test("normaliza e valida WhatsApp brasileiro", () => {
  assert.equal(normalizePhone("(37) 99999-1234"), "37999991234");
  assert.equal(formatPhone("37999991234"), "(37) 99999-1234");
  assert.equal(isValidPhone("(37) 99999-1234"), true);
  assert.equal(isValidPhone("9999"), false);
});

test("catálogo segue a regra definida para cliente existente", () => {
  assert.equal(campaign.catalogEligibility, "existing_customer_only");
  assert.equal(hasCatalog({ existingCustomer: "yes" }), true);
  assert.equal(hasCatalog({ existingCustomer: "no" }), false);
});

test("sorteio respeita estoque esgotado", () => {
  const onlyMug = [{ id: "mug", weight: 1, stock: 1 }, { id: "cup", weight: 1, stock: null }];
  assert.equal(choosePrize(onlyMug, { mug: 1 }, () => 0).id, "cup");
});

test("sorteio ponderado permite prêmios disponíveis", () => {
  const prize = choosePrize(campaign.prizes, {}, () => 0);
  assert.equal(prize.id, "mug");
});

test("códigos de ativação apontam para os brindes definidos", () => {
  assert.equal(campaign.activationCodes["111"], "cup");
  assert.equal(campaign.activationCodes["112"], "tool_bag");
  assert.equal(campaign.activationCodes["113"], "mug");
  assert.equal(campaign.activationCodes["114"], "shirt_white");
});
