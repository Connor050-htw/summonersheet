import api from './http';

export const getRiotIdByPUUID = async (puuid) => {
  try {
    const response = await api.get('/api/account/by-puuid', {
      params: { puuid }
    });
    return response.data; // { gameName, tagLine, puuid }
  } catch (error) {
    console.error('Error fetching Riot ID by PUUID:', error.message);
    throw error;
  }
}; 