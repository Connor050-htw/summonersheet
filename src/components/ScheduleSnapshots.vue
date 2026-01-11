<template>
  <div class="schedule-section">
    <h3 class="section-title">Auto Snapshots</h3>
    <p class="section-desc">Schedule 3 days of automatic stat snapshots.<br>
        Every day at 04:00 CET, the latest data is imported from Riot Games. <br>
        This means you don't need to submit a request every day to save the latest data.<br><br>
        You can have a maximum of 3 schedulers active.</p>

    <form @submit.prevent="handleSchedule" class="schedule-form">
      <div class="form-group">
        <label for="gameName">Game Name</label>
        <input
          id="gameName"
          v-model="gameName"
          type="text"
          required
          class="schedule-input"
          placeholder="SummonerName"
          :disabled="isLoading"
        />
      </div>

      <div class="form-group">
        <label for="tagLine">Tag</label>
        <input
          id="tagLine"
          v-model="tagLine"
          type="text"
          required
          class="schedule-input"
          placeholder="NA1"
          minlength="1"
          maxlength="10"
          :disabled="isLoading"
        />
      </div>

      <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="message success">{{ successMessage }}</p>

      <button 
        type="submit" 
        class="schedule-button"
        :disabled="isLoading"
      >
        <span v-if="isLoading" class="spinner"></span>
        <span v-else>Schedule 3 Days</span>
      </button>
    </form>

    <!-- Active schedules -->
    <div v-if="activeSchedules.length > 0" class="active-list">
      <h4 class="list-title">Active schedules</h4>
      <div v-for="schedule in activeSchedules" :key="schedule.id" class="schedule-item">
        <div class="item-info">
          <p class="item-name">{{ getPlayerDisplay(schedule) }}</p>
          <p class="item-status">Until: {{ formatDate(schedule.scheduled_until) }}</p>
        </div>
        <button 
          @click="cancelSchedule(schedule.id)"
          class="cancel-btn"
          :disabled="isLoading"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { supabase } from '../db/supabase'
import { getSummonerByName } from '../api/GetPlayerId'
import { syncPlayer } from '../db/players'

const { user } = useAuth()
const gameName = ref('')
const tagLine = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)
const activeSchedules = ref([])

onMounted(() => {
  if (user.value) {
    fetchActiveSchedules()
  }
})

const fetchActiveSchedules = async () => {
  if (!user.value) return
  try {
    const { data, error } = await supabase
      .from('scheduled_snapshots')
      .select(`
        id,
        player_id,
        status,
        scheduled_until,
        players (
          player_id,
          gameName,
          tagline
        )
      `)
      .eq('user_id', user.value.id)
      .eq('status', 'active')
      .gt('scheduled_until', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch error:', error)
      throw error
    }
    activeSchedules.value = data || []
  } catch (err) {
    console.error('Error fetching schedules:', err)
  }
}

const handleSchedule = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!gameName.value.trim() || !tagLine.value.trim()) {
    errorMessage.value = 'Please enter both game name and tag'
    return
  }

  // Check if user already has 3 active schedules
  if (activeSchedules.value.length >= 3) {
    errorMessage.value = 'You can only have 3 active schedules at a time. Cancel one to add a new one.'
    return
  }

  isLoading.value = true

  try {
    // Look up player_id from Riot API
    const playerData = await getSummonerByName(gameName.value.trim(), tagLine.value.trim(), 'euw1')
    
    if (!playerData?.puuid) {
      throw new Error('Player not found. Please check the name and tag.')
    }

    // Sync player to DB if not already there
    const syncedPlayer = await syncPlayer(playerData.puuid, playerData.gameName, playerData.tagLine, 'euw1')
    
    if (!syncedPlayer?.player_id) {
      throw new Error('Failed to sync player to database.')
    }

    const now = new Date()
    const scheduledUntil = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days

    const { data, error } = await supabase
      .from('scheduled_snapshots')
      .insert({
        user_id: user.value.id,
        player_id: syncedPlayer.player_id,
        status: 'active',
        scheduled_until: scheduledUntil.toISOString(),
      })
      .select()

    if (error) throw error

    successMessage.value = `Scheduled snapshots for ${gameName.value}#${tagLine.value}! Data will be collected for 3 days.`
    gameName.value = ''
    tagLine.value = ''

    // Refresh active schedules
    await fetchActiveSchedules()

    // Trigger initial snapshot
    await triggerSnapshot(syncedPlayer.player_id)
  } catch (err) {
    errorMessage.value = err.message || 'Failed to schedule snapshots'
  } finally {
    isLoading.value = false
  }
}

const cancelSchedule = async (scheduleId) => {
  isLoading.value = true
  try {
    const { error } = await supabase
      .from('scheduled_snapshots')
      .update({ status: 'cancelled' })
      .eq('id', scheduleId)
      .eq('user_id', user.value.id)

    if (error) throw error
    await fetchActiveSchedules()
  } catch (err) {
    errorMessage.value = err.message || 'Failed to cancel schedule'
  } finally {
    isLoading.value = false
  }
}

const triggerSnapshot = async (playerId) => {
  try {
    // TODO: Call worker endpoint to fetch and save stats for this player_id
  } catch (err) {
    console.error('Error triggering snapshot:', err)
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const getPlayerDisplay = (schedule) => {
  if (!schedule.players) return `Player #${schedule.player_id}`
  const p = schedule.players
  return `${p.gameName || 'Unknown'}#${p.tagline || 'N/A'}`
}
</script>

<style scoped>
.schedule-section {
  padding: 1.5rem 0;
  border-top: 1px solid rgba(226, 192, 141, 0.2);
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #e2c08d;
  margin: 0 0 0.25rem;
}

.section-desc {
  font-size: 0.8rem;
  color: rgba(244, 228, 193, 0.7);
  margin: 0 0 1rem;
}

.schedule-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #e2c08d;
}

.schedule-input {
  padding: 0.6rem 0.8rem;
  border: 1px solid #e2c08d;
  border-radius: 4px;
  font-size: 0.9rem;
  background: #1a1a1a;
  color: #f4e4c1;
  transition: all 0.2s ease;
}

.schedule-input:focus {
  outline: none;
  border-color: #f4e4c1;
  box-shadow: 0 0 0 2px rgba(226, 192, 141, 0.1);
}

.schedule-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.schedule-input::placeholder {
  color: rgba(226, 192, 141, 0.35);
}

.schedule-button {
  padding: 0.7rem 1rem;
  background: linear-gradient(90deg, #e2c08d 0%, #f4e4c1 100%);
  color: #1a1a1a;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
}

.schedule-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(226, 192, 141, 0.3);
}

.schedule-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(26, 26, 26, 0.3);
  border-top-color: #1a1a1a;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.message {
  font-size: 0.8rem;
  padding: 0.6rem 0.8rem;
  border-radius: 4px;
  margin: 0;
  text-align: center;
}

.message.error {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.message.success {
  background: rgba(16, 185, 129, 0.1);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.active-list {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(226, 192, 141, 0.2);
}

.list-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #e2c08d;
  margin: 0 0 0.75rem;
}

.schedule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(226, 192, 141, 0.05);
  border: 1px solid rgba(226, 192, 141, 0.15);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.item-info {
  flex: 1;
}

.item-name {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: #f4e4c1;
}

.item-status {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: rgba(244, 228, 193, 0.7);
}

.cancel-btn {
  padding: 0.4rem 0.8rem;
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
