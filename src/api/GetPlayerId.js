import api from './http';
import { DEFAULT_PLATFORM, DEFAULT_REGIONAL } from './regions';

// Example: Summoner by Name
export const getSummonerByName = async (gameName, tagLine, region = DEFAULT_PLATFORM) => {
  try {
    const response = await api.get('/api/account/by-riot-id', {
      params: { name: gameName, tag: tagLine, region }
    });
    //console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching summoner data:', error.message);
    throw error;
  }
};
