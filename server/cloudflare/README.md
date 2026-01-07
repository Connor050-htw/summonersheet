# Cloudflare Worker Proxy

Dieser Worker kapselt den geheimen Riot API Key und liefert nur Daten an dein Frontend (GitHub Pages) aus.

## Setup

1. Cloudflare Wrangler installieren

```bash
npm create cloudflare@latest
```

2. In diesem Ordner Secrets setzen

```bash
npx wrangler secret put RIOT_API_KEY
# Optional: eigene Pages-URL erlauben (alternativ in wrangler.toml setzen)
# npx wrangler secret put ALLOWED_ORIGIN
```

3. Deploy

```bash
npx wrangler deploy
```

4. Local Dev

```bash
npx wrangler dev
# Läuft auf http://localhost:8787
```

## Frontend Konfiguration

Im Vite-Frontend `.env` setzen:

```
VITE_PROXY_BASE=https://<dein-worker>.workers.dev
```

Für lokale Entwicklung:

```
VITE_PROXY_BASE=http://localhost:8787
```

## Endpunkte

- `GET /api/account/by-riot-id?name=...&tag=...`
- `GET /api/account/by-puuid?puuid=...`
- `GET /api/lol/summoner/by-puuid?puuid=...`
- `GET /api/lol/league/by-puuid?puuid=...`
- `GET /api/lol/champion-mastery/by-puuid?puuid=...`
- `GET /api/lol/match/ids?puuid=...&start=0&count=5&queue=430`
- `GET /api/lol/match/by-id/{matchId}`

CORS erlaubt standardmäßig `ALLOWED_ORIGIN` (GitHub Pages) sowie lokalen Zugriff bei Dev.
