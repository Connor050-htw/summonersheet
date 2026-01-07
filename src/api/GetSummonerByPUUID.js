import axios from 'axios';
import { API_KEY } from './config';

const riotApi = axios.create({
  baseURL: 'https://euw1.api.riotgames.com',
  headers: {
    'X-Riot-Token': API_KEY,
  },
});

export const getSummonerByPUUID = async (puuid) => {
  try {
    const response = await riotApi.get(`/lol/summoner/v4/summoners/by-puuid/${puuid}`);
    return response.data; // { id, accountId, puuid, name, profileIconId, revisionDate, summonerLevel }
  } catch (error) {
    console.error('Error fetching summoner by PUUID:', error.message);
    throw error;
  }
};