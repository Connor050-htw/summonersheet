<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import AuthModal from './components/AuthModal.vue'
import ResetPassword from './components/ResetPassword.vue'
import ScheduleSnapshots from './components/ScheduleSnapshots.vue'
import { useAuth } from './composables/useAuth'

const { user, loading, initAuth, setupAuthListener, signOut } = useAuth()
const route = useRoute()

const showAuthSidebar = ref(false)
let authSubscription = null

onMounted(async () => {
  await initAuth()
  authSubscription = setupAuthListener()
})

onUnmounted(() => {
  authSubscription?.unsubscribe()
})

const toggleAuthSidebar = () => {
  showAuthSidebar.value = !showAuthSidebar.value
}

const handleSignOut = async () => {
  try {
    await signOut()
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

const closeAuthSidebar = () => {
  showAuthSidebar.value = false
}

const isResetRoute = computed(() => route.name === 'reset')
</script>

<template>
  <ResetPassword v-if="isResetRoute" />
  <template v-else>
    <!-- Toggle Button -->
    <button 
      @click="toggleAuthSidebar" 
      class="auth-toggle"
    >
      <div class="hamburger-icon" :class="{ 'active': showAuthSidebar }">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span v-if="user" class="user-badge"></span>
    </button>

    <!-- Auth Sidebar -->
    <transition name="sidebar">
      <div v-if="showAuthSidebar" class="sidebar-overlay" @click="closeAuthSidebar">
        <div class="sidebar-content" @click.stop>
          <button @click="closeAuthSidebar" class="close-button" aria-label="Close"></button>
            
            <!-- Benefits Section (only show when not logged in) -->
            <div v-if="!user" class="benefits-section">
            <h2>Why Register?</h2>
            <div class="benefit-card">
              <div class="benefit-icon">📊</div>
              <div class="benefit-text">
                <h3>Automatic Snapshots</h3>
                <p>Schedule automatic stat collection for up to 3 days</p>
              </div>
            </div>
            <div class="benefit-card">
              <div class="benefit-icon">📈</div>
              <div class="benefit-text">
                <h3>Track Progress          </h3>
                <p>Monitor your improvement over time with historical data</p>
              </div>
            </div>
            <div class="benefit-card">
              <div class="benefit-icon">🎮</div>
              <div class="benefit-text">
                <h3>Multi-Account Support</h3>
                <p>Manage multiple summoner accounts in one place</p>
              </div>
            </div>
          </div>
          
          <div v-if="user" class="user-panel">
            <h2>Account</h2>
            <div class="user-info">
              <div class="user-avatar">👤</div>
              <p class="user-email">{{ user.email }}</p>
            </div>
            <button @click="handleSignOut" class="signout-button">Sign Out</button>
            
            <ScheduleSnapshots />
          </div>
          
          <AuthModal v-else @close="closeAuthSidebar" />
        </div>
      </div>
    </transition>

    <!-- Main App (always visible) -->
    <HelloWorld />
  </template>
</template>

<style scoped>
.auth-toggle {
  position: fixed;
  top: 0.9rem;
  left: 0.0rem;
  z-index: 900;
  width: 54px;
  height: 54px;
  border-radius: 9px;
  border: 2px solid #e2c08d;
  background: linear-gradient(135deg, #1a1a1a, #2c2c2c);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.auth-toggle:hover {
  border-color: #f4e4c1;
  box-shadow: 0 0 25px rgba(226, 192, 141, 0.4);
}

.hamburger-icon {
  width: 22px;
  height: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.3s ease;
}

.hamburger-icon span {
  display: block;
  width: 100%;
  height: 2px;
  background: #e2c08d;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.hamburger-icon.active span:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}

.hamburger-icon.active span:nth-child(2) {
  opacity: 0;
}

.hamburger-icon.active span:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

.user-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid #1a1a1a;
  border-radius: 50%;
  animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: stretch;
}

.sidebar-content {
  width: 520px;
  max-width: 95vw;
  background: linear-gradient(135deg, #1a1a1a, #2c2c2c);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
  position: relative;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  z-index: 10;
}

.close-button:hover {
  filter: drop-shadow(0 0 6px rgba(244, 228, 193, 0.5));
}

.close-button::before,
.close-button::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 2px;
  background: #e2c08d;
  top: 50%;
  left: 50%;
  transform-origin: center;
  transition: background 0.2s ease;
}

.close-button::before {
  transform: translate(-50%, -50%) rotate(45deg);
}

.close-button::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.close-button:hover::before,
.close-button:hover::after {
  background: #f4e4c1;
}

.user-panel {
  padding: 4rem 2.5rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-height: 100vh;
}

.user-panel h2 {
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(90deg, #e2c08d 0%, #f4e4c1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

/* Benefits Section */
.benefits-section {
  padding: 2rem 2rem 1rem 2rem;
  border-bottom: 1px solid rgba(226, 192, 141, 0.2);
}

.benefits-section h2 {
  font-size: 1.75rem;
  font-weight: bold;
  background: linear-gradient(90deg, #e2c08d 0%, #f4e4c1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 1.5rem 0;
}

.benefit-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(226, 192, 141, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(226, 192, 141, 0.2);
  margin-bottom: 0.75rem;
  transition: all 0.2s ease;
}

.benefit-card:hover {
  background: rgba(226, 192, 141, 0.1);
  border-color: rgba(226, 192, 141, 0.4);
  transform: translateX(4px);
}

.benefit-icon {
  font-size: 2rem;
  flex-shrink: 0;
  width: 2.5rem;
  min-width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.benefit-text {
  flex: 1;
}

.benefit-text h3 {
  color: #f4e4c1;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  text-align: left;
}

.benefit-text p {
  color: rgba(244, 228, 193, 0.7);
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
  text-align: left;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: rgba(226, 192, 141, 0.05);
  border-radius: 12px;
  border: 2px solid #e2c08d;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(226, 192, 141, 0.2);
  border: 2px solid #e2c08d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
}

.user-email {
  color: #f4e4c1;
  font-size: 1rem;
  margin: 0;
  text-align: center;
  word-break: break-all;
}

.signout-button {
  padding: 0.875rem 1.5rem;
  background: transparent;
  border: 2px solid #e2c08d;
  color: #e2c08d;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.signout-button:hover {
  background: rgba(226, 192, 141, 0.1);
  border-color: #f4e4c1;
  transform: translateY(-2px);
}

/* Sidebar Animation */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: all 0.3s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  opacity: 0;
}

.sidebar-enter-from .sidebar-content,
.sidebar-leave-to .sidebar-content {
  transform: translateX(-100%);
}

.sidebar-enter-active .sidebar-content,
.sidebar-leave-active .sidebar-content {
  transition: transform 0.3s ease;
}
</style>
