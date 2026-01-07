import api from './http';

// Fetch detailed player information using PUUID
export const getPlayerDetailsByPUUID = async (puuid) => {
  try {
    const response = await api.get('/api/lol/league/by-puuid', {
      params: { puuid }
    });
    //console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching player details:', error.message);
    throw error;
  }
};