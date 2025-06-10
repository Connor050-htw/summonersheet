import axios from 'axios';
import { API_KEY } from './config';

const riotApi = axios.create({
  baseURL: 'https://euw1.api.riotgames.com',
  params: {
    api_key: API_KEY, // Use the imported API key
  },
});

// Fetch champion mastery data using PUUID
export const getChampionMasteryByPUUID = async (puuid) => {
  try {
    const response = await riotApi.get(`/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching champion mastery data:', error.message);
    throw error;
  }
};