import axios from 'axios';
import { API_KEY } from './config';

const riotApi = axios.create({
  baseURL: 'https://europe.api.riotgames.com',
  params: {
    api_key: API_KEY,
  },
});

// Gibt die Stats der letzten 100 Normal Games zurück
export const getNormalStatsByPUUID = async (puuid) => {
  // Nur Draft Pick (430)
  const normalQueueId = 430;
  let wins = 0;
  let losses = 0;

  // 1. Match-IDs holen (nur Draft Pick, nur 5)
  const matchIdsResp = await riotApi.get(`/lol/match/v5/matches/by-puuid/${puuid}/ids`, {
    params: { start: 0, count: 5, queue: normalQueueId },
  });
  const matchIds = matchIdsResp.data;

  // 2. Matches holen und auswerten
  for (const matchId of matchIds) {
    const matchResp = await riotApi.get(`/lol/match/v5/matches/${matchId}`);
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