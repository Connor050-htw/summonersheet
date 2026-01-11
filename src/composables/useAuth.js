import { ref, computed } from 'vue'
import { supabase } from '../db/supabase'

const user = ref(null)
const session = ref(null)
const loading = ref(true)

export function useAuth() {
  // Initialize auth state
  const initAuth = async () => {
    loading.value = true
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      session.value = currentSession
      user.value = currentSession?.user ?? null
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      loading.value = false
    }
  }

  // Listen to auth changes
  const setupAuthListener = () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
      loading.value = false
    })
    return subscription
  }

  // Sign up with username + email + password; store username in metadata and profiles table
  const signUpWithUsername = async (username, email, password) => {
    const base = import.meta.env.BASE_URL || '/'
    const emailRedirectTo = `${window.location.origin}${base}`

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        // Keep username visible in Supabase dashboard as display_name/full_name
        data: { username, display_name: username, full_name: username },
      },
    })

    if (error) throw error

    return data
  }

  // Sign in with email and password (default flow)
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // Reset password request
  const resetPassword = async (email) => {
    const base = import.meta.env.BASE_URL || '/'
    const redirectTo = `${window.location.origin}${base}#/reset`
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    
    if (error) throw error
    return data
  }

  // Update password
  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    
    if (error) throw error
    return data
  }

  // Delete user account
  const deleteAccount = async () => {
    if (!user.value) throw new Error('No user logged in')

    try {
      // Delete user from auth
      const { error } = await supabase.auth.admin.deleteUser(user.value.id)
      if (error) throw error

      // Clear local state
      user.value = null
      session.value = null
    } catch (error) {
      console.error('Error deleting account:', error)
      throw error
    }
  }

  const isAuthenticated = computed(() => !!user.value)

  return {
    user,
    session,
    loading,
    isAuthenticated,
    initAuth,
    setupAuthListener,
    signUpWithUsername,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    deleteAccount,
  }
}
