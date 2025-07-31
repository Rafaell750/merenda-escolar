import axios from 'axios';

// 1. Pega a URL base do ambiente, exatamente como antes.
const baseURL = import.meta.env.VITE_API_BASE_URL;

// 2. Lança um erro claro se a variável não estiver configurada.
//    Isso evita bugs difíceis de encontrar no futuro.
if (!baseURL) {
  throw new Error("A variável de ambiente VITE_API_BASE_URL não foi definida. Verifique seus arquivos .env ou configuração de build.");
}

// 3. Cria uma instância do Axios com a configuração base.
const apiClient = axios.create({
  baseURL: baseURL, // A URL base para TODAS as requisições
  headers: {
    'Content-Type': 'application/json',
  }
});

// 4. (Opcional, mas muito poderoso) Adiciona um "interceptor" para
//    automaticamente incluir o token de autenticação em todas as requisições.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// 5. Exporta a instância configurada para ser usada em todo o projeto.
export default apiClient;