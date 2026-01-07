import api from './http';

// Fetch champion mastery data using PUUID
export const getChampionMasteryByPUUID = async (puuid) => {
  try {
    const response = await api.get('/api/lol/champion-mastery/by-puuid', {
      params: { puuid }
    });
    ////console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching champion mastery data:', error.message);
    throw error;
  }
};