import api from './http';
import { syncPlayer } from '../db/players.js';

export const getRiotIdByPUUID = async (puuid) => {
  try {
    const response = await api.get('/api/account/by-puuid', {
      params: { puuid }
    });
    const accountData = response.data; // { gameName, tagLine, puuid }

    // In DB speichern
    try {
      await syncPlayer(accountData.puuid, accountData.gameName, accountData.tagLine);
      console.log('✓ Player saved to database:', accountData.gameName);
    } catch (dbError) {
      console.warn('Database sync failed:', dbError.message);
      // API Daten trotzdem zurückgeben
    }

    return accountData;
  } catch (error) {
    console.error('Error fetching Riot ID by PUUID:', error.message);
    throw error;
  }
}; 