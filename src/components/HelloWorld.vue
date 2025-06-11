<script setup>
import { ref, onMounted } from 'vue';
import { getSummonerByName } from '../api/GetPlayerId';
import { getChampionMasteryByPUUID } from '../api/GetChampionMastery';
import { getPlayerDetailsByPUUID } from '../api/GetPlayerDetails';
import { getRiotIdByPUUID } from '../api/GetRiotIdByPUUID';
import { getSummonerByPUUID } from '../api/GetSummonerByPUUID';
import { generatePlayerPDF } from '../utils/pdfGenerator';

const gameName = ref('Connor050');
const tagLine = ref('EUW');
const playerData = ref(null);
const championMastery = ref(null);
const leagueDetails = ref(null);
const riotId = ref(null);
const summonerInfo = ref(null);
const errorMessage = ref('');
const pdfPreviewUrl = ref(null);

// Generate a placeholder PDF on component load
onMounted(async () => {
  pdfPreviewUrl.value = await generatePlayerPDF(null, null, null, null, null); // Async-Aufruf!
});

const fetchAndGeneratePDF = async () => {
  try {
    const data = await getSummonerByName(gameName.value, tagLine.value);
    playerData.value = data;

    const masteryData = await getChampionMasteryByPUUID(data.puuid);
    championMastery.value = masteryData;

    const leagueData = await getPlayerDetailsByPUUID(data.puuid);
    leagueDetails.value = leagueData;

    const riotIdData = await getRiotIdByPUUID(data.puuid);
    riotId.value = riotIdData;

    const summonerData = await getSummonerByPUUID(data.puuid);
    summonerInfo.value = summonerData;

    pdfPreviewUrl.value = await generatePlayerPDF(
      playerData.value,
      championMastery.value,
      leagueDetails.value,
      riotId.value,
      summonerInfo.value
    ); // Generate PDF with fetched data
    errorMessage.value = '';
  } catch (error) {
    errorMessage.value = 'Failed to fetch player data. Please try again.';
  }
};
</script>

<template>
  <div class="container">
    <h1 class="title">SummonerSheet</h1>
    <div class="form">
      <input v-model="gameName" class="input" placeholder="Enter Summoner Name" style="text-align: center;" />
      <input v-model="tagLine" class="input" placeholder="Enter Tag Line" style="text-align: center;" />
      <button @click="fetchAndGeneratePDF" class="button">Generate PDF</button>
    </div>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <div class="pdf-preview">
      <h3>PDF Preview:</h3>
      <iframe :src="pdfPreviewUrl" width="100%" height="1178rem"></iframe>
    </div>
    <p class="legal">
      SummonerSheet is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
    </p>
  </div>
</template>

<style scoped>
.container {
  font-family: 'Roboto', sans-serif;
  background: linear-gradient(135deg, #1a1a1a, #2c2c2c);
  color: #e2c08d;
  padding: 2rem;
  border-radius: 10px;
  width: 50rem;
  margin: 2rem auto;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.title {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #f4e4c1;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.input {
  padding: 0.8rem;
  border: 2px solid #e2c08d;
  border-radius: 5px;
  background: #1a1a1a;
  color: #f4e4c1;
  font-size: 1rem;
}

.input::placeholder {
  color: #a89c7c;
}

.button {
  padding: 0.8rem;
  border: none;
  border-radius: 5px;
  background: #e2c08d;
  color: #1a1a1a;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.button:hover {
  background: #f4e4c1;
}

.error-message {
  color: #ff4d4d;
  font-size: 1rem;
}

.pdf-preview {
  margin-top: 2rem;
  border: 2px solid #e2c08d;
  border-radius: 5px;
  overflow: hidden;
}

.legal {
  margin-top: 2rem;
  font-size: 0.9rem;
  color: #a89c7c;
  text-align: center;
}
</style>
