export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

    // Configure allowed origin (GitHub Pages URL), or allow localhost for dev.
    const allowedOrigin = env.ALLOWED_ORIGIN || 'http://localhost:5173';
    const origin = req.headers.get('Origin');
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin && origin !== 'null' ? origin : allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Helper to forward a Riot request with X-Riot-Token
    const forward = (riotUrl) => fetch(riotUrl, {
      headers: { 'X-Riot-Token': env.RIOT_API_KEY },
    });

    try {
      // Account API (europe cluster)
      if (url.pathname === '/api/account/by-riot-id') {
        const name = url.searchParams.get('name');
        const tag  = url.searchParams.get('tag');
        if (!name || !tag) return new Response('Bad Request', { status: 400, headers: corsHeaders });
        const upstream = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
        const resp = await forward(upstream);
        return new Response(await resp.text(), { status: resp.status, headers: { ...corsHeaders, 'Content-Type': resp.headers.get('Content-Type') ?? 'application/json' } });
      }

      if (url.pathname === '/api/account/by-puuid') {
        const puuid = url.searchParams.get('puuid');
        if (!puuid) return new Response('Bad Request', { status: 400, headers: corsHeaders });
        const upstream = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`;
        const resp = await forward(upstream);
        return new Response(await resp.text(), { status: resp.status, headers: { ...corsHeaders, 'Content-Type': resp.headers.get('Content-Type') ?? 'application/json' } });
      }

      // LoL platform routes (euw1)
      if (url.pathname === '/api/lol/summoner/by-puuid') {
        const puuid = url.searchParams.get('puuid');
        const upstream = `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
        const resp = await forward(upstream);
        return new Response(await resp.text(), { status: resp.status, headers: { ...corsHeaders, 'Content-Type': resp.headers.get('Content-Type') ?? 'application/json' } });
      }

      if (url.pathname === '/api/lol/league/by-puuid') {
        const puuid = url.searchParams.get('puuid');
        const upstream = `https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`;
        const resp = await forward(upstream);
        return new Response(await resp.text(), { status: resp.status, headers: { ...corsHeaders, 'Content-Type': resp.headers.get('Content-Type') ?? 'application/json' } });
      }

      if (url.pathname === '/api/lol/champion-mastery/by-puuid') {
        const puuid = url.searchParams.get('puuid');
        const upstream = `https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(puuid)}`;
        const resp = await forward(upstream);
        return new Response(await resp.text(), { status: resp.status, headers: { ...corsHeaders, 'Content-Type': resp.headers.get('Content-Type') ?? 'application/json' } });
      }

      // Match-V5 (europe cluster)
      if (url.pathname === '/api/lol/match/ids') {
        const puuid = url.searchParams.get('puuid');
        const start = url.searchParams.get('start') ?? '0';
        const count = url.searchParams.get('count') ?? '5';
        const queue = url.searchParams.get('queue');
        const qs = new URLSearchParams({ start, count });
        if (queue) qs.set('queue', queue);
        const upstream = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?${qs.toString()}`;
        const resp = await forward(upstream);
        return new Response(await resp.text(), { status: resp.status, headers: { ...corsHeaders, 'Content-Type': resp.headers.get('Content-Type') ?? 'application/json' } });
      }

      if (url.pathname.startsWith('/api/lol/match/by-id/')) {
        const matchId = url.pathname.split('/').pop();
        const upstream = `https://europe.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}`;
        const resp = await forward(upstream);
        return new Response(await resp.text(), { status: resp.status, headers: { ...corsHeaders, 'Content-Type': resp.headers.get('Content-Type') ?? 'application/json' } });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Proxy error', message: e?.message || String(e) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
};
