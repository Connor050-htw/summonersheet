import axios from 'axios';
import { API_KEY } from './config';

const riotApi = axios.create({
  baseURL: 'https://europe.api.riotgames.com',
  params: {
    api_key: API_KEY,
  },
});

export const getRiotIdByPUUID = async (puuid) => {
  try {
    const response = await riotApi.get(`/riot/account/v1/accounts/by-puuid/${puuid}`);
    return response.data; // { gameName, tagLine, puuid }
  } catch (error) {
    console.error('Error fetching Riot ID by PUUID:', error.message);
    throw error;
  }
}; 