import axios from 'axios';
import { PROXY_BASE } from './config';

// Axios-Instanz, die auf den sicheren Proxy zeigt.
// PROXY_BASE sollte auf deinen Cloudflare Worker / Vercel Function zeigen.
const api = axios.create({
  baseURL: PROXY_BASE,
});

export default api;
