<template>
  <div class="reset-bg">
    <div class="reset-container">
      <div class="reset-card">
        <div class="header">
          <h1 class="title">Reset Password</h1>
          <p class="subtitle">Set a new password to continue.</p>
        </div>

        <form @submit.prevent="handleUpdate" class="form">
          <div class="inputs-row">
            <div class="form-group">
              <label class="label" for="new-password">New Password</label>
              <input
                id="new-password"
                v-model="newPassword"
                type="password"
                class="input"
                placeholder="New password"
                minlength="6"
                required
              />
            </div>

            <div class="form-group">
              <label class="label" for="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                v-model="confirmPassword"
                type="password"
                class="input"
                placeholder="Repeat password"
                minlength="6"
                required
              />
            </div>
          </div>

          <p v-if="message" class="message success">{{ message }}</p>
          <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

          <div class="actions">
            <a href="#/" class="back-link">← Back to app</a>
            <button type="submit" class="button" :disabled="isLoading || !sessionReady">
              <span v-if="isLoading" class="spinner"></span>
              <span v-else>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../db/supabase'

const route = useRoute()
const newPassword = ref('')
const confirmPassword = ref('')
const message = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const sessionReady = ref(false)

onMounted(async () => {
  // Parse hash fragment: #/reset#access_token=...&refresh_token=...&type=recovery
  const hash = window.location.hash
  const fragmentPart = hash.split('#')[2] || ''
  const params = new URLSearchParams(fragmentPart)
  
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  const type = params.get('type')

  if (!accessToken || !refreshToken || type !== 'recovery') {
    errorMessage.value = 'Reset link is invalid or expired. Please request a new one.'
    return
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (error) {
    errorMessage.value = 'Session could not be restored. Please request a new link.'
    return
  }

  sessionReady.value = true
})

const handleUpdate = async () => {
  errorMessage.value = ''
  message.value = ''

  if (newPassword.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isLoading.value = true
  const { error } = await supabase.auth.updateUser({
    password: newPassword.value,
  })

  if (error) {
    errorMessage.value = error.message || 'Could not update password. Please try again.'
  } else {
    message.value = 'Password updated! You can now sign in with your new password.'
  }

  isLoading.value = false
}
</script>

<style scoped>
.reset-bg {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.5rem;
  background: url('/summonersheet/background.png') no-repeat center center fixed;
  background-size: cover;
}

.reset-container {
  width: 100%;
  max-width: 1000px;
  height: 30rem;
  width: 50rem;
  position: relative;
  z-index: 1;
}

.reset-card {
  background: linear-gradient(135deg, #1a1a1a, #2c2c2c);
  border: 2px solid #e2c08d;
  border-radius: 10px;
  padding: 2rem 3rem;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(226, 192, 141, 0.15);
}

.header {
  margin-bottom: 1.5rem;
  text-align: center;
}
.header {
  margin-bottom: 1.5rem;
  text-align: center;
}
.title {
  margin: 0 0 0.25rem;
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  background: linear-gradient(90deg, #e2c08d 0%, #f4e4c1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.02em;
}

.subtitle {
  margin: 0;
  color: rgba(244, 228, 193, 0.85);
  font-size: 0.95rem;
  text-align: center;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.inputs-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  color: #e2c08d;
  font-size: 0.9rem;
}

.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e2c08d;
  border-radius: 5px;
  background: #1a1a1a;
  color: #f4e4c1;
  font-size: 1rem;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: #f4e4c1;
  box-shadow: 0 0 0 3px rgba(226, 192, 141, 0.15);
  background: #0f0f0f;
}

.input::placeholder {
  color: rgba(226, 192, 141, 0.4);
}

.button {
  margin-top: 0;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(90deg, #e2c08d 0%, #f4e4c1 100%);
  color: #1a1a1a;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  box-shadow: 0 2px 8px rgba(226, 192, 141, 0.2);
  min-width: 200px;
}

.button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(226, 192, 141, 0.4);
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(26, 26, 26, 0.4);
  border-top-color: #1a1a1a;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.message {
  margin: 0;
  padding: 0.75rem 0.9rem;
  border-radius: 8px;
  font-size: 0.95rem;
}

.message.success {
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.message.error {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.back-link {
  color: #e2c08d;
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #f4e4c1;
}

@media (max-width: 520px) {
  .reset-card {
    padding: 1.75rem;
  }

  .title {
    font-size: 1.6rem;
  }
}
</style>
