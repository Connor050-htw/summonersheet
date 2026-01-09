import { supabase } from './supabase.js'
import { PROXY_BASE } from '../api/config.js'

// Player zu DB hinzufügen oder aktualisieren
export const syncPlayer = async (puuid, gameName, tagLine, region = 'euw1') => {
  try {
    // Route write via Worker to keep service key server-side
    const resp = await fetch(`${PROXY_BASE}/api/db/player/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ puuid, gameName, tagLine, region })
    })
    if (!resp.ok) throw new Error(`Worker error ${resp.status}`)
    const data = await resp.json()
    return Array.isArray(data) ? data[0] : data
  } catch (error) {
    console.error('Error syncing player:', error.message)
    throw error
  }
}

// Summoner Stats speichern
export const saveSummonerStats = async (playerId, summonerData) => {
  try {
    // Route write via Worker to keep service key server-side
    const resp = await fetch(`${PROXY_BASE}/api/db/stats/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, summonerData })
    })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(`Worker error ${resp.status}${text ? `: ${text}` : ''}`)
    }
    const data = await resp.json()
    return data
  } catch (error) {
    console.error('Error saving summoner stats:', error.message)
    throw error
  }
}

// Neueste Stats für einen Player abrufen
export const getLatestSummonerStats = async (playerId) => {
  try {
    const { data, error } = await supabase
      .from('summoner_stats')
      .select('*')
      .eq('player_id', playerId)
      .order('recorded_at', { ascending: false })
      .limit(1)

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error('Error fetching latest summoner stats:', error.message)
    throw error
  }
}

// Komplette Statistik-Historie für einen Player
export const getPlayerHistory = async (playerId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('summoner_stats')
      .select('*')
      .eq('player_id', playerId)
      .order('recorded_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching player history:', error.message)
    throw error
  }
}

// Player nach PUUID finden
export const getPlayerByPUUID = async (puuid) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('puuid', puuid)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = nicht gefunden
    return data || null
  } catch (error) {
    console.error('Error fetching player:', error.message)
    throw error
  }
}

// Alle Snapshots (Daten mit Zeitstempel) für einen Player abrufen
export const getPlayerSnapshots = async (puuid) => {
  try {
    const player = await getPlayerByPUUID(puuid)
    if (!player) return []

    const { data, error } = await supabase
      .from('summoner_stats')
      .select('recorded_at')
      .eq('player_id', player.player_id)
      .order('recorded_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching player snapshots:', error.message)
    throw error
  }
}

// Stats für einen bestimmten Zeitpunkt abrufen
export const getSummonerStatsByDate = async (puuid, recordedAt) => {
  try {
    const player = await getPlayerByPUUID(puuid)
    if (!player) return null

    const { data, error } = await supabase
      .from('summoner_stats')
      .select('*')
      .eq('player_id', player.player_id)
      .eq('recorded_at', recordedAt)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  } catch (error) {
    console.error('Error fetching summoner stats by date:', error.message)
    throw error
  }
}

// ===== Champion Stats =====

// Champion Stats speichern
export const saveChampionStats = async (playerId, championMasteryData) => {
  try {
    const resp = await fetch(`${PROXY_BASE}/api/db/champion-stats/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, championMasteryData })
    })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(`Worker error ${resp.status}${text ? `: ${text}` : ''}`)
    }
    const data = await resp.json()
    return data
  } catch (error) {
    console.error('Error saving champion stats:', error.message)
    throw error
  }
}

// Neueste Champion Stats für einen Player abrufen
export const getLatestChampionStats = async (playerId) => {
  try {
    const { data, error } = await supabase
      .from('champion_stats')
      .select('*')
      .eq('player_id', playerId)
      .order('recorded_at', { ascending: false })
      .order('champion_points', { ascending: false })
      .limit(10) // Top 10 Champions

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching latest champion stats:', error.message)
    throw error
  }
}

// Champion Stats Historie für einen Player
export const getChampionStatsHistory = async (playerId, championId, limit = 30) => {
  try {
    const { data, error } = await supabase
      .from('champion_stats')
      .select('*')
      .eq('player_id', playerId)
      .eq('champion_id', championId)
      .order('recorded_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching champion stats history:', error.message)
    throw error
  }
}

// ===== Rank Stats =====

// Rank Stats speichern
export const saveRankStats = async (playerId, rankedData) => {
  try {
    const resp = await fetch(`${PROXY_BASE}/api/db/rank-stats/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, rankedData })
    })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(`Worker error ${resp.status}${text ? `: ${text}` : ''}`)
    }
    const data = await resp.json()
    return data
  } catch (error) {
    console.error('Error saving rank stats:', error.message)
    throw error
  }
}

// Neueste Rank Stats für einen Player abrufen
export const getLatestRankStats = async (playerId) => {
  try {
    const { data, error } = await supabase
      .from('rank_stats')
      .select('*')
      .eq('player_id', playerId)
      .order('recorded_at', { ascending: false })
      .limit(10)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching latest rank stats:', error.message)
    throw error
  }
}

// Rank Stats Historie für eine bestimmte Queue
export const getRankStatsHistory = async (playerId, queueType, limit = 30) => {
  try {
    const { data, error } = await supabase
      .from('rank_stats')
      .select('*')
      .eq('player_id', playerId)
      .eq('queue_type', queueType)
      .order('recorded_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching rank stats history:', error.message)
    throw error
  }
}
