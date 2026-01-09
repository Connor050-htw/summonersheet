import api from './http';
import { DEFAULT_PLATFORM } from './regions';

// Gibt die Stats der letzten 100 Normal Games zurück
export const getNormalStatsByPUUID = async (puuid, region = DEFAULT_PLATFORM) => {
  // Nur Draft Pick (430)
  const normalQueueId = 430;
  let wins = 0;
  let losses = 0;

  // 1. Match-IDs holen (nur Draft Pick, nur 5)
  const matchIdsResp = await api.get('/api/lol/match/ids', {
    params: { puuid, start: 0, count: 5, queue: normalQueueId, region },
  });
  const matchIds = matchIdsResp.data;

  // 2. Matches holen und auswerten
  for (const matchId of matchIds) {
    const matchResp = await api.get(`/api/lol/match/by-id/${matchId}`);
    const match = matchResp.data;
    if (match.info.queueId !== normalQueueId) continue;

    const participant = match.info.participants.find(p => p.puuid === puuid);
    if (!participant) continue;
    if (participant.win) wins++;
    else losses++;
  }

  return {
    queueType: 'NORMAL_DRAFT',
    wins,
    losses,
    games: wins + losses,
  };
};