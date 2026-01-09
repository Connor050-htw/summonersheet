import api from './http';
import { DEFAULT_PLATFORM } from './regions';

// Fetch champion mastery data using PUUID
export const getChampionMasteryByPUUID = async (puuid, region = DEFAULT_PLATFORM) => {
  try {
    const response = await api.get('/api/lol/champion-mastery/by-puuid', {
      params: { puuid, region }
    });
    ////console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching champion mastery data:', error.message);
    throw error;
  }
};