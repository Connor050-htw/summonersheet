import api from './http';
import { DEFAULT_PLATFORM } from './regions';

// Fetch detailed player information using PUUID
export const getPlayerDetailsByPUUID = async (puuid, region = DEFAULT_PLATFORM) => {
  try {
    const response = await api.get('/api/lol/league/by-puuid', {
      params: { puuid, region }
    });
    //console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching player details:', error.message);
    throw error;
  }
};