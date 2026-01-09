<template>
  <div class="bg-move"></div>
  <div class="page-scale">
    <div class="container">
      <h1 class="title krass-title">SummonerSheet</h1>
      <div class="description-box">
        <p>
          <strong>What is this Website?</strong><br/>
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
          @keyup.enter="fetchAndGeneratePDF"
        />
        <div class="form-row">
          <input
            v-model="tagLine"
            class="input"
            placeholder="Enter Tag Line"
            style="text-align: center;"
            @keyup.enter="fetchAndGeneratePDF"
          />
          <select v-model="region" class="input select-region">
            <option v-for="r in regions" :key="r.value" :value="r.value">
              {{ r.label }}
            </option>
          </select>
          <button 
            v-if="snapshots.length === 0"
            @click="loadSnapshots" 
            class="button button-secondary" 
            :disabled="isLoadingSnapshots"
          >
            <span v-if="isLoadingSnapshots" class="button-spinner"></span>
            <span v-else>Select Date</span>
          </button>
          <div v-else class="date-picker-inline">
            <select v-model="selectedSnapshot" class="input">
              <option value="today">Today (Latest)</option>
              <option v-for="snapshot in snapshots" :key="snapshot.recorded_at" :value="snapshot.recorded_at">
                {{ formatDate(snapshot.recorded_at) }}
              </option>
            </select>
            <button @click="resetSnapshots" class="button-reset" title="Reset Date Selection">×</button>
          </div>
        </div>
        <button @click="fetchAndGeneratePDF" class="button">Generate PDF</button>
      </div>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      <div v-if="pdfPreviewUrl && !isLoading && hasGenerated" class="pdf-preview">
        <h3>PDF Preview:</h3>
        <iframe :src="pdfPreviewUrl" width="100%" height="942rem"></iframe>
        <a
          :href="pdfPreviewUrl"
          :download="`${gameName || 'Summoner'}-${tagLine || 'Tag'}-SummonerSheet.pdf`"
          class="button"
          style="margin: 1rem auto 0 auto; display: block; max-width: 220px; text-align: center;"
        >
          Download PDF
        </a>
      </div>
      <p class="legal">
        SummonerSheet is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
      </p>
    </div>
  </div>
  <div v-if="isLoading" class="loading-overlay">
    <div class="spinner">
      <div class="spinner-inner"></div>
    </div>
    <div class="loading-text">Generating PDF...</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { getSummonerByName } from '../api/GetPlayerId';
import { getChampionMasteryByPUUID } from '../api/GetChampionMastery';
import { getPlayerDetailsByPUUID } from '../api/GetPlayerDetails';
import { getRiotIdByPUUID } from '../api/GetRiotIdByPUUID';
import { getSummonerByPUUID } from '../api/GetSummonerByPUUID';
import { getPlayerSnapshots, getSummonerStatsByDate, getPlayerByPUUID, saveChampionStats, saveRankStats } from '../db/players';
import { generatePlayerPDF } from '../utils/pdfGenerator';
// import { getTftLeagueByPUUID } from '../api/GetTftLeagueByPUUID';

// Platzhalter für Summoner Name und Tag Line
const gameName = ref('');
const tagLine = ref('');
const region = ref('EUW');
const playerData = ref(null);
const championMastery = ref(null);
const leagueDetails = ref(null);
const riotId = ref(null);
const summonerInfo = ref(null);
const errorMessage = ref('');
const pdfPreviewUrl = ref(null);
const isLoading = ref(false); // <-- Neu hinzugefügt
const isLoadingSnapshots = ref(false); // Loading nur für Snapshots
const hasGenerated = ref(false);
const snapshots = ref([]);
const selectedSnapshot = ref('today');
const regions = [
  { value: 'EUW', label: 'EUW' },
  { value: 'EUNE', label: 'EUNE' },
  { value: 'NA', label: 'NA' },
  { value: 'KR', label: 'KR' },
  { value: 'LAN', label: 'LAN' },
  { value: 'LAS', label: 'LAS' },
  { value: 'BR', label: 'BR' },
  { value: 'TR', label: 'TR' },
  { value: 'RU', label: 'RU' },
  { value: 'JP', label: 'JP' },
  { value: 'OCE', label: 'OCE' },
];

// Format Datum für Anzeige
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric'
  });
}

// Lade Snapshots aus der DB
const loadSnapshots = async () => {
  errorMessage.value = '';
  if (!gameName.value || !tagLine.value) {
    errorMessage.value = 'Please enter both Summoner Name and Tag Line first.';
    return;
  }

  try {
    isLoadingSnapshots.value = true;
    const data = await getSummonerByName(gameName.value, tagLine.value);
    const loadedSnapshots = await getPlayerSnapshots(data.puuid);
    snapshots.value = loadedSnapshots;
    
    if (loadedSnapshots.length === 0) {
      errorMessage.value = 'No historic data found for this player yet.';
    }
  } catch (error) {
    if (error?.response?.status === 404) {
      errorMessage.value = 'Player not found! Please check the name and tag line.';
    } else {
      errorMessage.value = 'Failed to load snapshots. Please try again.';
    }
  } finally {
    isLoadingSnapshots.value = false;
  }
}

// Reset Snapshots (zurück zum "Select Date" Button)
const resetSnapshots = () => {
  snapshots.value = [];
  selectedSnapshot.value = 'today';
  errorMessage.value = '';
}

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
  let skipDelay = false;
  const start = Date.now();
  try {
    const data = await getSummonerByName(gameName.value, tagLine.value);
    playerData.value = data;

    const masteryData = await getChampionMasteryByPUUID(data.puuid);
    championMastery.value = masteryData;

    const leagueData = await getPlayerDetailsByPUUID(data.puuid);
    // const tftLeagueData = await getTftLeagueByPUUID(data.puuid);

    // Kombiniere alle League-Daten (Solo, Flex) - TFT auskommentiert
    const allLeagueDetails = [
      ...(leagueData || []),
      // ...(tftLeagueData || [])
    ];

    leagueDetails.value = allLeagueDetails;

    const riotIdData = await getRiotIdByPUUID(data.puuid);
    riotId.value = riotIdData;

    let summonerData;
    if (selectedSnapshot.value === 'today') {
      // Aktuelle Daten
      summonerData = await getSummonerByPUUID(data.puuid);
      summonerInfo.value = summonerData;
    } else {
      // Historische Daten
      const historicalStats = await getSummonerStatsByDate(data.puuid, selectedSnapshot.value);
      summonerData = {
        summonerLevel: historicalStats?.summoner_level,
        profileIconId: historicalStats?.profile_icon_id
      };
      summonerInfo.value = summonerData;
    }

    // Player record holen, um Stats zu speichern
    let playerRecord = null;
    try {
      playerRecord = await getPlayerByPUUID(data.puuid);
    } catch (dbErr) {
      console.warn('Could not fetch player record for stats:', dbErr?.message || dbErr);
    }

    // Nur bei aktuellen Daten: Champion- und Rank-Stats in DB schreiben
    if (playerRecord?.player_id && selectedSnapshot.value === 'today') {
      try {
        await saveChampionStats(playerRecord.player_id, masteryData);
      } catch (err) {
        console.warn('Saving champion stats failed:', err?.message || err);
      }

      try {
        await saveRankStats(playerRecord.player_id, allLeagueDetails);
      } catch (err) {
        console.warn('Saving rank stats failed:', err?.message || err);
      }
    }

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
    selectedSnapshot.value = 'today'; // Reset nach erfolgreicher Generierung
  } catch (error) {
    if (error?.response?.status === 404) {
      errorMessage.value = 'Player not found! Please check the name and tag line.';
      isLoading.value = false;
      return; // <--- WICHTIG: Sofort zurückkehren, damit finally nicht ausgeführt wird!
    } else {
      errorMessage.value = 'Failed to fetch player data. Please try again.';
    }
  } finally {
    if (isLoading.value) { // <--- Nur wenn noch geladen wird, Delay ausführen
      const elapsed = Date.now() - start;
      if (elapsed < 1500) {
        await wait(1500 - elapsed);
      }
      isLoading.value = false;
    }
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
  //document.body.style.zoom = "85%";
  bgMoveEl = document.querySelector('.bg-move');
  window.addEventListener('mousemove', handleMouseMove);
});
onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
});
</script>

<style scoped>
:root {
  font-size: 80%;
}

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

.page-scale {
  /* transform: scale(0.9); */
  /* transform-origin: top center; */
  width: 100%;
}

.container {
  position: relative;
  z-index: 1;
  font-family: 'Roboto', sans-serif;
  background: linear-gradient(135deg, #1a1a1a, #2c2c2c);
  color: #e2c08d;
  padding: 1.6rem;           /* vorher: 2rem */
  border-radius: 10px;
  width: 100%;
  max-width: 41.6rem;        /* vorher: 52rem */
  margin: 1.6rem auto;       /* vorher: 2rem */
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  /* transform: scale(0.9);  <-- ENTFERNEN */
}

.title {
  font-size: 2rem;           /* vorher: 2.5rem */
  text-align: center;
  margin-bottom: 1.2rem;     /* vorher: 1.5rem */
  color: #f4e4c1;
}

.krass-title {
  font-size: 2.4rem;         /* vorher: 3rem */
  margin-bottom: 1.2rem;     /* vorher: 1.5rem */
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
  padding: 1em 1.2em;        /* vorher: 1.2em 1.5em */
  margin-bottom: 1.6em;      /* vorher: 2em */
  font-size: 0.88em;         /* vorher: 1.1em */
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
  gap: 0.8rem;               /* vorher: 1rem */
  margin-bottom: 1.6rem;     /* vorher: 2rem */
}

.form-row {
  display: flex;
  gap: 0.8rem;
}

.form-row input {
  flex: 1;
}

.form-row button {
  flex: 1;
}

.input {
  padding: 0.64rem;          /* vorher: 0.8rem */
  border: 2px solid #e2c08d;
  border-radius: 5px;
  background: #1a1a1a;
  color: #f4e4c1;
  font-size: 0.8rem;         /* vorher: 1rem */
}

.input::placeholder {
  color: #a89c7c;
}

.date-picker-inline {
  flex: 1;
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.date-picker-inline select {
  flex: 1;
}

.button-reset {
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 2px solid #e2c08d;
  border-radius: 5px;
  background: rgba(226, 192, 141, 0.1);
  color: #e2c08d;
  font-size: 1.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-reset:hover {
  background: rgba(226, 192, 141, 0.2);
  transform: scale(1.1);
}

.date-picker-box {
  border: 2px solid #e2c08d;
  border-radius: 8px;
  background: rgba(244, 228, 193, 0.05);
  padding: 0.8rem;
  margin-bottom: 0.4rem;
}

.date-picker-box label {
  display: block;
  color: #e2c08d;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.button {
  padding: 0.64rem;          /* vorher: 0.8rem */
  border: none;
  border-radius: 10px;
  background: linear-gradient(270deg, #e2c08d 0%, #f4e4c1 100%);
  color: #2a210a;
  font-size: 0.8rem;         /* vorher: 1rem */
  font-weight: 700;
  cursor: pointer;
  transition: box-shadow 0.3s, background 0.3s;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.08em;
  box-shadow: 0 2px 8px 0 #e2c08d22;
  text-shadow:
    0 1px 2px #fff8,
    0 2px 6px #0004;
}

.button::after {
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

.button:hover::after {
  left: 120%;
  transition: left 0.7s;
}

.button-secondary {
  background: linear-gradient(270deg, #8b7355 0%, #a89c7c 100%);
  color: #2a210a;
  box-shadow: 0 2px 8px 0 #8b735522;
}

.button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.button-spinner {
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  border: 2px solid rgba(42, 33, 10, 0.3);
  border-top-color: #2a210a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.button:hover {
  background: linear-gradient(90deg, #f4e4c1 0%, #e2c08d 100%);
  box-shadow: 0 4px 16px 0 #e2c08d44;
}

.error-message {
  color: #ff4d4d;
  font-size: 1rem;
}

.pdf-preview {
  margin-top: 1.6rem;        /* vorher: 2rem */
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

@media (max-width: 600px) {
  .container {
    padding: 0.5rem;
    max-width: 100vw;
    border-radius: 10px; /* vorher: 0; jetzt wieder abgerundet */
    margin: 0;
    box-shadow: none;
  }

  .title,
  .krass-title {
    font-size: 1.3rem;
    padding: 0.2em 0;
  }

  .description-box {
    font-size: 0.95em;
    padding: 0.7em 0.5em;
    margin-bottom: 1em;
  }

  .form {
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .input,
  .button {
    font-size: 1rem;
    padding: 0.7rem;
    width: 100%;
    box-sizing: border-box;
  }

  .pdf-preview {
    margin-top: 1rem;
    border-width: 1px;
    border-radius: 3px;
    padding: 0;
  }

  .pdf-preview iframe {
    min-width: 100vw;
    width: 100vw;
    height: 60vh;
    display: block;
    border: none;
  }

  .loading-overlay {
    font-size: 1rem;
    padding: 0;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border-width: 4px;
    margin-bottom: 1rem;
  }

  .spinner-inner {
    top: 8px; left: 8px;
    width: 16px; height: 16px;
  }

  .loading-text {
    font-size: 1rem;
  }

  .legal {
    font-size: 0.75rem;
    margin-top: 1rem;
    padding: 0 0.5rem;
  }
}
</style>
