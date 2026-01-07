import axios from 'axios';
import { API_KEY } from './config';

const riotApi = axios.create({
  baseURL: 'https://europe.api.riotgames.com',
  headers: {
    'X-Riot-Token': API_KEY,
  },
});

// Example: Summoner by Name
export const getSummonerByName = async (gameName, tagLine) => {
  try {
    const response = await riotApi.get(`/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`);
    //console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching summoner data:', error.message);
    throw error;
  }
};
