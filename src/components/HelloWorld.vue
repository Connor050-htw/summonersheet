<script setup>
import { ref, onMounted } from 'vue';
import { getSummonerByName } from '../api/GetPlayerId';
import { getChampionMasteryByPUUID } from '../api/GetChampionMastery';
import { generatePlayerPDF } from '../utils/pdfGenerator';

defineProps({
  msg: String,
});

const gameName = ref('Connor050'); // Default value for Summoner Name
const tagLine = ref('EUW'); // Default value for Tag Line
const playerData = ref(null);
const championMastery = ref(null);
const errorMessage = ref('');
const pdfPreviewUrl = ref(null); // Reactive variable for the PDF preview URL

// Generate a placeholder PDF on component load
onMounted(() => {
  pdfPreviewUrl.value = generatePlayerPDF(null, null); // Generate placeholder PDF
});

const fetchAndGeneratePDF = async () => {
  try {
    const data = await getSummonerByName(gameName.value, tagLine.value);
    playerData.value = data;

    const masteryData = await getChampionMasteryByPUUID(data.puuid);
    championMastery.value = masteryData;

    pdfPreviewUrl.value = generatePlayerPDF(playerData.value, championMastery.value); // Generate PDF with fetched data
    errorMessage.value = '';
  } catch (error) {
    errorMessage.value = 'Failed to fetch player data. Please try again.';
  }
};
</script>

<template>
  <div class="container">
    <h1 class="title">League of Legends PDF-Creator</h1>
    <div class="form">
      <input v-model="gameName" class="input" placeholder="Enter Summoner Name" />
      <input v-model="tagLine" class="input" placeholder="Enter Tag Line" />
      <button @click="fetchAndGeneratePDF" class="button">Generate PDF</button>
    </div>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <div class="pdf-preview">
      <h3>PDF Preview:</h3>
      <iframe :src="pdfPreviewUrl" width="100%" height="500px"></iframe>
    </div>
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
</style>
