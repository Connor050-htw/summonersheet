export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

    // Configure allowed origin (GitHub Pages URL), or allow localhost for dev.
    const allowedOrigin = env.ALLOWED_ORIGIN || 'http://localhost:5173';
    const origin = req.headers.get('Origin');
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin && origin !== 'null' ? origin : allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Helper to forward a Riot request with X-Riot-Token
    const forward = (riotUrl) => fetch(riotUrl, {
      headers: { 'X-Riot-Token': env.RIOT_API_KEY },
    });

    // Helper to call Supabase REST API using service role (server-side only)
    const supaFetch = async (path, init = {}) => {
      const supabaseUrl = env.SUPABASE_URL;
      const serviceKey = env.SUPABASE_SERVICE_ROLE;
      if (!supabaseUrl || !serviceKey) {
        return new Response(JSON.stringify({ error: 'Supabase not configured in Worker env' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const headers = {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      };
      const resp = await fetch(`${supabaseUrl}/rest/v1${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
      const text = await resp.text();
      const type = resp.headers.get('Content-Type') ?? 'application/json';
      return new Response(text, { status: resp.status, headers: { ...corsHeaders, 'Content-Type': type } });
    };

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

      // ----- Supabase DB endpoints (server-side writes) -----
      // Upsert player
      if (url.pathname === '/api/db/player/sync' && req.method === 'POST') {
        const body = await req.json().catch(() => null);
        if (!body || !body.puuid || !body.gameName || !body.tagLine) {
          return new Response(JSON.stringify({ error: 'Missing fields: puuid, gameName, tagLine' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const payload = [{ puuid: body.puuid, gameName: body.gameName, tagline: body.tagLine }];
        // onConflict via Prefer header; returning=representation to get row back
        // Upsert using puuid as conflict target
        return supaFetch('/players?on_conflict=puuid', {
          method: 'POST',
          headers: {
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(payload),
        });
      }

      // Insert summoner stats snapshot
      if (url.pathname === '/api/db/stats/save' && req.method === 'POST') {
        const body = await req.json().catch(() => null);
        if (!body || !body.playerId || !body.summonerData) {
          return new Response(JSON.stringify({ error: 'Missing fields: playerId, summonerData' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const s = body.summonerData || {};
        const dateOnly = new Date().toISOString().slice(0, 10); // YYYY-MM-DD for 'date' column
        const payload = [{
          player_id: Number(body.playerId),
          summoner_level: s.summonerLevel != null ? Number(s.summonerLevel) : null,
          profile_icon_id: s.profileIconId != null ? Number(s.profileIconId) : null,
          recorded_at: dateOnly,
        }];
        // Upsert per day per player; requires unique constraint on (player_id, recorded_at)
        const supaResp = await supaFetch('/summoner_stats?on_conflict=player_id,recorded_at', {
          method: 'POST',
          headers: {
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(payload),
        });

        // Gracefully handle duplicate (already have a snapshot today)
        if (supaResp.status === 409) {
          const bodyText = await supaResp.text();
          try {
            const json = JSON.parse(bodyText);
            if (json?.code === '23505') {
              return new Response(JSON.stringify({ status: 'duplicate', message: 'Snapshot for today already exists' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            // fallthrough to propagate other 409s
            return new Response(bodyText, { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          } catch (e) {
            return new Response(bodyText || JSON.stringify({ error: 'Conflict' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }

        return supaResp;
      }

      // Insert champion stats snapshot
      if (url.pathname === '/api/db/champion-stats/save' && req.method === 'POST') {
        const body = await req.json().catch(() => null);
        if (!body || !body.playerId || !body.championMasteryData) {
          return new Response(JSON.stringify({ error: 'Missing fields: playerId, championMasteryData' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const dateOnly = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const masteryArray = Array.isArray(body.championMasteryData) ? body.championMasteryData : [body.championMasteryData];

        // Sort by points descending and take top 3 only
        const top3 = masteryArray
          .sort((a, b) => (b.championPoints || 0) - (a.championPoints || 0))
          .slice(0, 3);
        
        // Create payload for top 3 champions with only DB fields
        const payload = top3.map(champ => ({
          player_id: Number(body.playerId),
          champion_id: Number(champ.championId),
          champion_level: Number(champ.championLevel),
          champion_points: Number(champ.championPoints),
          recorded_at: dateOnly,
        }));

        // Upsert per day per player per champion
        return supaFetch('/champion_stats?on_conflict=player_id,champion_id,recorded_at', {
          method: 'POST',
          headers: {
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(payload),
        });
      }

      // Insert rank stats snapshot
      if (url.pathname === '/api/db/rank-stats/save' && req.method === 'POST') {
        const body = await req.json().catch(() => null);
        if (!body || !body.playerId || !body.rankedData) {
          return new Response(JSON.stringify({ error: 'Missing fields: playerId, rankedData' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const dateOnly = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const rankedArray = Array.isArray(body.rankedData) ? body.rankedData : [body.rankedData];

        // Create payload with only DB fields
        const payload = rankedArray.map(rank => ({
          player_id: Number(body.playerId),
          queue_type: rank.queueType,
          tier: rank.tier || null,
          rank: rank.rank || null,
          wins: rank.wins != null ? Number(rank.wins) : 0,
          losses: rank.losses != null ? Number(rank.losses) : 0,
          winrate: rank.wins + rank.losses > 0 ? Math.round((rank.wins / (rank.wins + rank.losses)) * 100) : 0,
          recorded_at: dateOnly,
        }));

        // Upsert per day per player per queue
        return supaFetch('/rank_stats?on_conflict=player_id,queue_type,recorded_at', {
          method: 'POST',
          headers: {
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(payload),
        });
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
