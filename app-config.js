/**
 * PIROMAX PASS — configuração da ação FENAPI.
 *
 * Antes da feira, ajuste os prêmios, estoques e o endereço do Instagram.
 * O modo local funciona sem internet e serve para a demonstração. Para controle
 * real entre vários celulares, configure `api.baseUrl` com uma API própria.
 */
export const campaign = {
  id: "fenapi-2026",
  name: "PIROMAX PASS",
  event: "FENAPI",
  instagramUrl: "https://www.instagram.com/piromaxfogos/",
  catalogEligibility: "existing_customer_only", // "all_b2b" | "existing_customer_only" | "none"
  api: {
    baseUrl: "/api", // Vazio = modo local. O server.mjs já oferece esta API.
    adminToken: "" // Nunca exponha um token real em uma página pública.
  },
  operationPin: "TROQUE-ESTE-PIN", // Troque antes da feira. Proteção real exige autenticação no servidor.
  activationCodes: {
    "111": "cup",
    "112": "tool_bag",
    "113": "mug",
    "114": "shirt_white"
  },
  prizes: [
    { id: "mug", name: "Caneca exclusiva Piromax", shortName: "Caneca exclusiva", icon: "☕", image: "assets/caneca-piromax-small.png", weight: 10, stock: 24 },
    { id: "tool_bag", name: "Bolsa porta-ferramentas Piromax", shortName: "Bolsa porta-ferramentas", icon: "🎒", weight: 3, stock: 8 },
    { id: "cap", name: "Boné Piromax", shortName: "Boné Piromax", icon: "🧢", weight: 12, stock: 36 },
    { id: "kit", name: "Kit Piromax", shortName: "Kit Piromax", icon: "🎁", weight: 8, stock: 20 },
    { id: "shirt_white", name: "Camiseta exclusiva Piromax", shortName: "Camiseta Piromax", icon: "👕", image: "assets/camiseta-branca-piromax-small.png", weight: 7, stock: 16 },
    { id: "shirt_black", name: "Camiseta preta Piromax", shortName: "Camiseta preta", icon: "👕", image: "assets/camiseta-preta-piromax-small.png", weight: 4, stock: 10 },
    { id: "surprise", name: "Brinde surpresa Piromax", shortName: "Brinde surpresa", icon: "✦", weight: 12, stock: 36 },
    { id: "cup", name: "Copo Piromax", shortName: "Copo Piromax", icon: "🥤", image: "assets/copo-piromax.png", weight: 55, stock: null }
  ]
};

export const brazilStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];
