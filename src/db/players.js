import { supabase } from './supabase.js'

// Player zu DB hinzufügen oder aktualisieren
export const syncPlayer = async (puuid, gameName, tagLine) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .upsert({
        puuid,
        gameName,
        tagline: tagLine,
      }, { onConflict: 'puuid' })
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error syncing player:', error.message)
    throw error
  }
}

// Summoner Stats speichern
export const saveSummonerStats = async (playerId, summonerData) => {
  try {
    const { data, error } = await supabase
      .from('summoner_stats')
      .insert({
        player_id: playerId,
        summoner_level: summonerData.summonerLevel,
        account_id: summonerData.accountId,
        profile_icon_id: summonerData.profileIconId,
        recorded_at: new Date()
      })

    if (error) throw error
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
