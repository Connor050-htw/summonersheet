import axios from 'axios';
import { API_KEY } from './config';

const riotApi = axios.create({
  baseURL: 'https://europe.api.riotgames.com',
  params: {
    api_key: API_KEY, // Use the imported API key
  },
});

// Fetch detailed player information using PUUID
export const getPlayerDetailsByPUUID = async (puuid) => {
  try {
    const response = await riotApi.get(`/lol/league/v4/entries/by-puuid/${puuid}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching player details:', error.message);
    throw error;
  }
};