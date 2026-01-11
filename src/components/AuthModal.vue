<template>
  <div class="auth-sidebar-container">
    <div class="auth-card">
      <h2 class="auth-title">{{ isLogin ? 'Sign In' : 'Create Account' }}</h2>
      
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="!isLogin" class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            class="auth-input"
            placeholder="summonername"
            :disabled="isLoading"
            minlength="3"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="auth-input"
            placeholder="you@example.com"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="auth-input"
            placeholder="••••••••"
            :disabled="isLoading"
            minlength="6"
          />
        </div>

        <div v-if="!isLogin" class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            class="auth-input"
            placeholder="••••••••"
            :disabled="isLoading"
            minlength="6"
          />
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

        <button 
          type="submit" 
          class="auth-button"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="button-spinner"></span>
          <span v-else>{{ isLogin ? 'Sign In' : 'Sign Up' }}</span>
        </button>
      </form>

      <div class="auth-footer">
        <button 
          @click="toggleMode" 
          class="link-button"
          :disabled="isLoading"
        >
          {{ isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In" }}
        </button>
        
        <button 
          v-if="isLogin"
          @click="showForgotPassword = true"
          class="link-button"
          :disabled="isLoading"
        >
          Forgot Password?
        </button>
      </div>

      <!-- Forgot Password Modal -->
      <div v-if="showForgotPassword" class="modal-overlay" @click.self="showForgotPassword = false">
        <div class="modal-content">
          <h3>Reset Password</h3>
          <form @submit.prevent="handleResetPassword">
            <div class="form-group">
              <label for="reset-email">Email</label>
              <input
                id="reset-email"
                v-model="resetEmail"
                type="email"
                required
                class="auth-input"
                placeholder="your@email.com"
              />
            </div>
            <p v-if="resetMessage" class="success-message">{{ resetMessage }}</p>
            <div class="modal-buttons">
              <button type="submit" class="auth-button">Send Reset Link</button>
              <button type="button" @click="showForgotPassword = false" class="button-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const { signIn, signUpWithUsername, resetPassword } = useAuth()

const emit = defineEmits(['close'])

const isLogin = ref(true)
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)
const showForgotPassword = ref(false)
const resetEmail = ref('')
const resetMessage = ref('')

const toggleMode = () => {
  isLogin.value = !isLogin.value
  errorMessage.value = ''
  successMessage.value = ''
  password.value = ''
  confirmPassword.value = ''
  email.value = ''
  username.value = ''
}

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // Validation
  if (!isLogin.value) {
    if (!username.value || username.value.length < 3) {
      errorMessage.value = 'Username must be at least 3 characters'
      return
    }
  }

  if (!isLogin.value && password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters'
    return
  }

  isLoading.value = true

  try {
    if (isLogin.value) {
      // Close sidebar after successful login
      setTimeout(() => {
        emit('close')
      }, 1000)
      await signIn(email.value.trim(), password.value)
      successMessage.value = 'Successfully signed in!'
    } else {
      if (!email.value) {
        throw new Error('Email is required to create an account')
      }
      await signUpWithUsername(username.value.trim(), email.value.trim(), password.value)
      successMessage.value = 'Account created! Please check your email to verify your account.'
    }
  } catch (error) {
    errorMessage.value = error.message || 'An error occurred'
  } finally {
    isLoading.value = false
  }
}

const handleResetPassword = async () => {
  resetMessage.value = ''
  try {
    await resetPassword(resetEmail.value)
    resetMessage.value = 'Password reset link sent! Check your email.'
    setTimeout(() => {
      showForgotPassword.value = false
      resetEmail.value = ''
      resetMessage.value = ''
    }, 3000)
  } catch (error) {
    resetMessage.value = error.message || 'An error occurred'
  }
}
</script>

<style scoped>
.auth-sidebar-container {
  padding: 3rem 1.5rem 2rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.auth-card {
  background: rgba(226, 192, 141, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  padding: 2rem;
  width: calc(100% - 1rem);
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 2px solid #e2c08d;
  box-sizing: border-box;
  margin: 0 auto;
}

.auth-title {
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 2rem;
  background: linear-gradient(90deg, #e2c08d 0%, #f4e4c1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #e2c08d;
}

.auth-input {
  padding: 0.75rem 1rem;
  border: 2px solid #e2c08d;
  border-radius: 5px;
  font-size: 1rem;
  background: #1a1a1a;
  color: #f4e4c1;
  transition: all 0.3s ease;
}

.auth-input:focus {
  outline: none;
  border-color: #f4e4c1;
  box-shadow: 0 0 0 3px rgba(226, 192, 141, 0.1);
}

.auth-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-input::placeholder {
  color: rgba(226, 192, 141, 0.4);
}

.auth-button {
  padding: 0.875rem 1.5rem;
  background: linear-gradient(90deg, #e2c08d 0%, #f4e4c1 100%);
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  box-shadow: 0 2px 8px rgba(226, 192, 141, 0.2);
}

.auth-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(226, 192, 141, 0.4);
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.button-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(26, 26, 26, 0.3);
  border-top-color: #1a1a1a;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(226, 192, 141, 0.2);
}

.link-button {
  background: none;
  border: none;
  color: #e2c08d;
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  transition: color 0.2s ease;
}

.link-button:hover:not(:disabled) {
  color: #f4e4c1;
}

.link-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  text-align: center;
  margin: 0;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
}

.success-message {
  color: #10b981;
  font-size: 0.875rem;
  text-align: center;
  margin: 0;
  padding: 0.5rem;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 6px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: linear-gradient(135deg, #1a1a1a, #2c2c2c);
  border: 2px solid #e2c08d;
  padding: 2rem;
  border-radius: 10px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #f4e4c1;
}

.modal-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.button-secondary {
  padding: 0.875rem 1.5rem;
  background: transparent;
  color: #e2c08d;
  border: 2px solid #e2c08d;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
}

.button-secondary:hover {
  background: rgba(226, 192, 141, 0.1);
  border-color: #f4e4c1;
}
</style>
