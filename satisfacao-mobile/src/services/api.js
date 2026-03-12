import axios from 'axios';
import Constants from 'expo-constants';

// Em ambiente de desenvolvimento local (Android Emulator usa 10.0.2.2, iOS Simulator usa localhost)
// Se estiver rodando no dispositivo físico, use o IP da sua máquina na rede (ex: 192.168.x.x)
const baseURL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'http://10.41.1.11:3003';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
