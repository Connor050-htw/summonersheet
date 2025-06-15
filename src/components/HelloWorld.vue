<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { getSummonerByName } from '../api/GetPlayerId';
import { getChampionMasteryByPUUID } from '../api/GetChampionMastery';
import { getPlayerDetailsByPUUID } from '../api/GetPlayerDetails';
import { getRiotIdByPUUID } from '../api/GetRiotIdByPUUID';
import { getSummonerByPUUID } from '../api/GetSummonerByPUUID';
import { generatePlayerPDF } from '../utils/pdfGenerator';

const gameName = ref('MarFlow');
const tagLine = ref('EUW');
const playerData = ref(null);
const championMastery = ref(null);
const leagueDetails = ref(null);
const riotId = ref(null);
const summonerInfo = ref(null);
const errorMessage = ref('');
const pdfPreviewUrl = ref(null);
const isLoading = ref(false); // <-- Neu hinzugefügt
const hasGenerated = ref(false);

// Generate a placeholder PDF on component load
onMounted(async () => {
  pdfPreviewUrl.value = null; // Keine Preview beim Start!
});

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const fetchAndGeneratePDF = async () => {
  isLoading.value = true;
  hasGenerated.value = false;
  const start = Date.now();
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
      summonerInfo.value,
      null
    );
    hasGenerated.value = true;
    errorMessage.value = '';
  } catch (error) {
    errorMessage.value = 'Failed to fetch player data. Please try again.';
  } finally {
    const elapsed = Date.now() - start;
    if (elapsed < 1500) {
      await wait(1500 - elapsed);
    }
    isLoading.value = false;
  }
};

let bgMoveEl = null;
function handleMouseMove(e) {
  if (!bgMoveEl) return;
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;
  // Werte anpassen für mehr/weniger Bewegung
  const offsetX = (x - 0.5) * 40; // px
  const offsetY = (y - 0.5) * 40; // px
  bgMoveEl.style.backgroundPosition = `calc(50% + ${offsetX}px) calc(50% + ${offsetY}px)`;
}

onMounted(() => {
  bgMoveEl = document.querySelector('.bg-move');
  window.addEventListener('mousemove', handleMouseMove);
});
onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
});
</script>

<template>
  <div class="bg-move"></div>
  <div class="container">
    <h1 class="title krass-title">SummonerSheet</h1>
    <div class="description-box">
      <p>
        <strong>What is this Website?</strong><br />
        Generate a beautiful PDF with the most important stats and information about your League of Legends account.<br />
        You can share, download, or print the PDF to impress your friend!<br />
      </p>
    </div>
    <div class="form">
      <input
        v-model="gameName"
        class="input"
        placeholder="Enter Summoner Name"
        style="text-align: center;"
      />
      <input
        v-model="tagLine"
        class="input"
        placeholder="Enter Tag Line"
        style="text-align: center;"
      />
      <button @click="fetchAndGeneratePDF" class="button">Generate PDF</button>
    </div>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <!-- PDF Preview nur anzeigen, wenn pdfPreviewUrl gesetzt ist UND nicht im Initialzustand -->
    <div v-if="pdfPreviewUrl && !isLoading && hasGenerated" class="pdf-preview">
      <h3>PDF Preview:</h3>
      <iframe :src="pdfPreviewUrl" width="100%" height="1178rem"></iframe>
    </div>
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner">
        <div class="spinner-inner"></div>
      </div>
      <div class="loading-text">Generating PDF...</div>
    </div>
    <p class="legal">
      SummonerSheet is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
    </p>
  </div>
</template>

<style scoped>
.bg-move {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  background: url('/summonersheet/background.png') no-repeat center center fixed;
  background-size: cover;
  transition: background-position 0.2s;
  pointer-events: none;
}

.container {
  position: relative;
  z-index: 1;
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

.krass-title {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1.5rem;
  background: linear-gradient(90deg, #e2c08d 0%, #f4e4c1 100%);
  background-size: 100% auto;
  color: #2a210a; /* Deutlich kontrastreicher als #b89b5e */
  font-weight: 700;
  letter-spacing: 0.08em;
  border-radius: 10px;
  padding: 0.4em 0;
  box-shadow: 0 2px 8px 0 #e2c08d22;
  text-shadow:
    0 1px 2px #fff8,
    0 2px 6px #0004;
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.3s;
}

.krass-title::after {
  content: '';
  position: absolute;
  top: 0; left: -60%;
  width: 40%;
  height: 100%;
  background: linear-gradient(120deg, transparent 0%, #fff3 50%, transparent 100%);
  transform: skewX(-20deg);
  transition: left 0.6s;
  pointer-events: none;
}

.krass-title:hover::after {
  left: 110%;
}

@keyframes gradient-move {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}

/* Shine effect on hover */
.krass-title::after {
  content: '';
  position: absolute;
  top: 0; left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(120deg, transparent 0%, #fff6 50%, transparent 100%);
  transform: skewX(-25deg);
  transition: left 0.5s;
  pointer-events: none;
}

.krass-title:hover::after {
  left: 120%;
  transition: left 0.7s;
}

.description-box {
  border: 2px solid #e2c08d;
  border-radius: 8px;
  background: rgba(244, 228, 193, 0.07);
  color: #f4e4c1;
  padding: 1.2em 1.5em;
  margin-bottom: 2em;
  font-size: 1.1em;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.description-box strong {
  color: #e2c08d;
  font-size: 1.15em;
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

.loading-overlay {
  position: fixed;
  z-index: 10000;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(26, 26, 26, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.spinner {
  width: 70px;
  height: 70px;
  border: 6px solid #e2c08d44;
  border-top: 6px solid #e2c08d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
  box-shadow: 0 0 24px #e2c08d55;
  position: relative;
}

.spinner-inner {
  position: absolute;
  top: 14px; left: 14px;
  width: 28px; height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e2c08d 60%, #f4e4c1 100%);
  filter: blur(1px);
  opacity: 0.7;
  animation: pulse 1.2s infinite alternate;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { opacity: 0.7; }
  100% { opacity: 1; }
}

.loading-text {
  color: #e2c08d;
  font-size: 1.3rem;
  letter-spacing: 0.08em;
  text-shadow: 0 2px 8px #000a;
}

.legal {
  margin-top: 2rem;
  font-size: 0.9rem;
  color: #a89c7c;
  text-align: center;
}
</style>
