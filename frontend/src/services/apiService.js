// src/services/apiService.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', // URL base do seu backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Interceptor para adicionar o Token JWT ---
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Adiciona o cabeçalho Authorization se o token existir
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Interceptor: Token adicionado ao cabeçalho', config.url);
    } else {
        console.log('Interceptor: Nenhum token encontrado para', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Interceptor de Resposta (Opcional: para lidar com 401/403 globalmente) ---
apiClient.interceptors.response.use(
  (response) => response, // Passa respostas de sucesso adiante
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('Interceptor: Erro 401/403 detectado. Deslogando...');
      // Token inválido ou expirado, ou sem permissão
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      // Redireciona para login (evita loops se já estiver no login)
      if (window.location.pathname !== '/login') {
         window.location.href = '/login';
      }
    }
    return Promise.reject(error); // Rejeita para que a chamada original possa tratar
  }
);


// --- Funções da API ---

const login = (username, password) => {
  return apiClient.post('/auth/login', { username, password });
};

const registerUser = (userData) => {
  // userData = { username: '...', password: '...', role: '...' }
  return apiClient.post('/users/register', userData);
};

const getProdutos = () => {
  return apiClient.get('/produtos'); // Já estará protegido pelo interceptor
};

const addProduto = (produtoData) => {
  return apiClient.post('/produtos', produtoData); // Protegido
};

const deleteProduto = (id) => {
    return apiClient.delete(`/produtos/${id}`); // Protegido
}

// Adicione outras chamadas conforme necessário (getUsers, etc.)
const getUsers = () => {
    return apiClient.get('/users'); // Rota protegida para admin
}

const getSchools = () => {
  return apiClient.get('/escolas'); // Rota que criamos no backend
}


export default {
  login,
  registerUser,
  getProdutos,
  addProduto,
  deleteProduto,
  getUsers,
  getSchools,
  // Exporte o cliente axios se precisar usá-lo diretamente em algum lugar
  // apiClient
};