import api from './http';

export const getSummonerByPUUID = async (puuid) => {
  try {
    const response = await api.get('/api/lol/summoner/by-puuid', {
      params: { puuid }
    });
    return response.data; // { id, accountId, puuid, name, profileIconId, revisionDate, summonerLevel }
  } catch (error) {
    console.error('Error fetching summoner by PUUID:', error.message);
    throw error;
  }
};