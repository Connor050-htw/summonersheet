import api from './http';

// Example: Summoner by Name
export const getSummonerByName = async (gameName, tagLine) => {
  try {
    const response = await api.get('/api/account/by-riot-id', {
      params: { name: gameName, tag: tagLine }
    });
    //console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching summoner data:', error.message);
    throw error;
  }
};
