import axios from 'axios';
import { API_KEY } from './config';

const riotApi = axios.create({
  baseURL: 'https://euw1.api.riotgames.com',
  headers: {
    'X-Riot-Token': API_KEY,
  },
});

// Fetch detailed player information using PUUID
export const getPlayerDetailsByPUUID = async (puuid) => {
  try {
    const response = await riotApi.get(`/lol/league/v4/entries/by-puuid/${puuid}`);
    //console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching player details:', error.message);
    throw error;
  }
};