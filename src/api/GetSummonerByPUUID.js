import api from './http';
import { getPlayerByPUUID, syncPlayer, saveSummonerStats } from '../db/players.js';
import { DEFAULT_PLATFORM } from './regions';

export const getSummonerByPUUID = async (puuid, region = DEFAULT_PLATFORM) => {
  try {
    const response = await api.get('/api/lol/summoner/by-puuid', {
      params: { puuid, region }
    });
    const summonerData = response.data;

    // In DB speichern
    try {
      let player = await getPlayerByPUUID(puuid);
      
      if (!player) {
        player = await syncPlayer(puuid, summonerData.name, 'unknown', region);
      }

      await saveSummonerStats(player.player_id, {
        summonerLevel: summonerData.summonerLevel,
        accountId: summonerData.accountId,
        profileIconId: summonerData.profileIconId
      });
    } catch (dbError) {
      console.warn('Database sync failed:', dbError.message);
      // API Daten trotzdem zurückgeben
    }

    return summonerData;
  } catch (error) {
    console.error('Error fetching summoner by PUUID:', error.message);
    throw error;
  }
};