import axios from 'axios';
import { API_KEY } from './config';

const riotApi = axios.create({
  baseURL: 'https://euw1.api.riotgames.com',
  headers: {
    'X-Riot-Token': API_KEY,
  },
});

// TFT Ranked Daten per PUUID abfragen
export const getTftLeagueByPUUID = async (puuid) => {
  try {
    const response = await riotApi.get(`/tft/league/v1/by-puuid/${puuid}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching TFT league data:', error.message);
    throw error;
  }
};