import axios from 'axios';

// Em ambiente de desenvolvimento local (Android Emulator usa 10.0.2.2, iOS Simulator usa localhost)
// Se estiver rodando no dispositivo físico, use o IP da sua máquina na rede (ex: 192.168.x.x)
const api = axios.create({
  baseURL: 'http://10.41.1.11:3003', // Ajuste para o IP correto da sua máquina
  withCredentials: true,
});

export default api;