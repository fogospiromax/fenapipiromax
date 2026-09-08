/**
 * Servidor sem dependências externas para o PIROMAX PASS.
 * Em produção, execute com PIROMAX_OPERATION_PIN definido no ambiente.
 */
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { randomUUID } from "node:crypto";
import { campaign } from "./app-config.js";
import { choosePrize, createCode, hasCatalog, normalizePhone } from "./logic.js";

const port = Number(process.env.PORT || 4173);
const dataDirectory = process.env.PIROMAX_DATA_DIR || join(process.cwd(), "data");
const databasePath = join(dataDirectory, "piromax-pass.json");
const operationPin = process.env.PIROMAX_OPERATION_PIN || campaign.operationPin;
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".mp4": "video/mp4", ".webp": "image/webp", ".json": "application/json; charset=utf-8" };

async function data() {
  if (!existsSync(databasePath)) return { leads: [], inventory: {} };
  return JSON.parse(await readFile(databasePath, "utf8"));
}
async function save(database) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(databasePath, JSON.stringify(database, null, 2));
}
const json = (response, status, body) => { response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); response.end(JSON.stringify(body)); };
const body = async (request) => {
  const chunks = []; for await (const chunk of request) chunks.push(chunk);
  try { return JSON.parse(Buffer.concat(chunks).toString() || "{}"); } catch { return {}; }
};
const isOperation = (request) => request.headers["x-operation-pin"] === operationPin;
const findPrize = (id) => campaign.prizes.find((prize) => prize.id === id);

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const method = request.method || "GET";

  if (url.pathname === "/api/health") return json(response, 200, { ok: true, campaign: campaign.id });
  if (url.pathname === "/api/admin/check") return json(response, isOperation(request) ? 200 : 401, { ok: isOperation(request) });
  if (url.pathname === "/api/leads" && method === "GET") {
    if (!isOperation(request)) return json(response, 401, { error: "Operação não autorizada" });
    const database = await data(); return json(response, 200, database);
  }
  if (url.pathname === "/api/leads" && method === "POST") {
    const input = await body(request); const database = await data(); const phoneNormalized = normalizePhone(input.phone);
    const existing = database.leads.find((lead) => lead.phoneNormalized === phoneNormalized);
    if (existing) return json(response, 200, { record: existing, duplicate: true });
    const record = {
      id: randomUUID(), code: createCode(input.profile), profile: input.profile, name: String(input.name || "").trim(),
      phone: String(input.phone || "").trim(), phoneNormalized, city: String(input.city || "").trim(), state: input.state,
      company: String(input.company || "").trim(), existingCustomer: input.existingCustomer, catalog: hasCatalog(input),
      assignedPrize: findPrize(campaign.activationCodes?.[input.activationCode]), prize: null, spunAt: null, redeemedAt: null, createdAt: new Date().toISOString(), source: campaign.id
    };
    database.leads.push(record); await save(database); return json(response, 201, { record, duplicate: false });
  }
  const preparation = url.pathname.match(/^\/api\/leads\/([^/]+)\/prepare$/);
  if (preparation && method === "POST") {
    const database = await data(); const record = database.leads.find((lead) => lead.id === preparation[1]);
    if (!record) return json(response, 404, { error: "PASS não encontrado" });
    if (!record.prize && !record.assignedPrize) { record.assignedPrize = choosePrize(campaign.prizes, database.inventory); await save(database); }
    return json(response, 200, { record });
  }
  const spin = url.pathname.match(/^\/api\/leads\/([^/]+)\/spin$/);
  if (spin && method === "POST") {
    const database = await data(); const record = database.leads.find((lead) => lead.id === spin[1]);
    if (!record) return json(response, 404, { error: "PASS não encontrado" });
    if (record.prize) return json(response, 200, { record });
    const prize = record.assignedPrize || choosePrize(campaign.prizes, database.inventory);
    record.prize = prize; record.spunAt = new Date().toISOString(); database.inventory[prize.id] = (database.inventory[prize.id] || 0) + 1;
    await save(database); return json(response, 200, { record });
  }
  const assignment = url.pathname.match(/^\/api\/leads\/([^/]+)\/assignment$/);
  if (assignment && method === "PATCH") {
    if (!isOperation(request)) return json(response, 401, { error: "Operação não autorizada" });
    const input = await body(request); const database = await data(); const record = database.leads.find((lead) => lead.id === assignment[1]);
    const prize = findPrize(input.prizeId);
    if (!record || record.prize || !prize) return json(response, 422, { error: "Prêmio não pode ser preparado" });
    record.assignedPrize = prize; await save(database); return json(response, 200, { record });
  }
  const redemption = url.pathname.match(/^\/api\/leads\/([^/]+)\/redeem$/);
  if (redemption && method === "PATCH") {
    if (!isOperation(request)) return json(response, 401, { error: "Operação não autorizada" });
    const database = await data(); const record = database.leads.find((lead) => lead.id === redemption[1]);
    if (!record) return json(response, 404, { error: "PASS não encontrado" });
    record.redeemedAt ||= new Date().toISOString(); await save(database); return json(response, 200, { record });
  }
  if (url.pathname.startsWith("/api/")) return json(response, 404, { error: "Rota não encontrada" });

  const requested = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\//, "");
  const filePath = normalize(join(process.cwd(), requested));
  if (!filePath.startsWith(process.cwd())) return json(response, 403, { error: "Acesso negado" });
  try { const file = await readFile(filePath); response.writeHead(200, { "Content-Type": mime[extname(filePath)] || "application/octet-stream" }); response.end(file); }
  catch { response.writeHead(404); response.end("Página não encontrada"); }
});
server.listen(port, () => console.log(`Piromax PASS disponível em http://localhost:${port}`));
