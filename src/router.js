import { createRouter, createWebHashHistory } from 'vue-router'

// Dummy components; App handles rendering based on route
const Empty = { template: '<div />' }

const routes = [
  {
    path: '/',
    name: 'home',
    component: Empty,
  },
  {
    path: '/reset',
    name: 'reset',
    component: Empty,
  },
]

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})
