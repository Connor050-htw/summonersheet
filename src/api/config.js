// Frontend darf KEINE Secrets enthalten. Dieser Platzhalter bleibt leer.
// Die App ruft künftig einen Proxy (Cloudflare Worker / Vercel Function) auf,
// der den geheimen Riot API Key serverseitig hält.
//
// Setze in deiner Umgebung die Variable `VITE_PROXY_BASE` (z.B. in .env):
// VITE_PROXY_BASE=https://<dein-worker>.workers.dev
//
// Für lokale Entwicklung kannst du den Worker mit `wrangler dev` starten,
// dann ist er unter http://localhost:8787 erreichbar.
export const PROXY_BASE = import.meta?.env?.VITE_PROXY_BASE || 'https://summonersheet-proxy.summonersheet-connor050.workers.dev';
