// /frontend/src/services/apiService.js

/**
 * Visão Geral:
 * Este módulo centraliza a comunicação com a API backend da aplicação.
 * Ele utiliza a biblioteca `axios` para realizar requisições HTTP.
 * Inclui interceptors para adicionar automaticamente o token JWT (JSON Web Token)
 * às requisições e para tratar globalmente erros de autenticação/autorização (401/403).
 * Expõe funções específicas para cada endpoint da API, facilitando o uso
 * em outros partes do frontend.
 *
 * Funcionalidades Principais:
 * 1.  CONFIGURAÇÃO DO CLIENTE AXIOS:
 *     - `apiClient` é uma instância do Axios configurada com a `baseURL` da API
 *       e headers padrão (Content-Type: application/json).
 * 2.  INTERCEPTOR DE REQUISIÇÃO:
 *     - Antes de cada requisição ser enviada, este interceptor verifica se existe um
 *       `authToken` no `localStorage`.
 *     - Se um token for encontrado, ele é adicionado ao cabeçalho `Authorization`
 *       da requisição no formato `Bearer <token>`.
 *     - Logs no console indicam se o token foi adicionado ou não.
 * 3.  INTERCEPTOR DE RESPOSTA (OPCIONAL, MAS IMPLEMENTADO):
 *     - Após cada resposta ser recebida, este interceptor verifica se ocorreu um erro
 *       com status 401 (Unauthorized) ou 403 (Forbidden).
 *     - Se tal erro for detectado, indica que o token é inválido, expirou ou o usuário
 *       não tem permissão.
 *     - Remove o `authToken` e `authUser` do `localStorage`.
 *     - Redireciona o usuário para a página de login (`/login`), a menos que já esteja nela,
 *       para evitar loops de redirecionamento.
 *     - A promessa original é rejeitada para que a lógica de tratamento de erro no
 *       local da chamada original possa também ser executada, se necessário.
 * 4.  FUNÇÕES DE SERVIÇO DA API:
 *     - `login(username, password)`: Envia uma requisição POST para `/auth/login`.
 *     - `registerUser(userData)`: Envia uma requisição POST para `/users/register`.
 *     - `getProdutos()`: Envia uma requisição GET para `/produtos`.
 *     - `addProduto(produtoData)`: Envia uma requisição POST para `/produtos`.
 *     - `deleteProduto(id)`: Envia uma requisição DELETE para `/produtos/:id`.
 *     - `getUsers()`: Envia uma requisição GET para `/users` (geralmente rota protegida para admin).
 *     - `getSchools()`: Envia uma requisição GET para `/escolas`.
 *     - Outras funções podem ser adicionadas conforme necessário para interagir com mais endpoints.
 * 5.  EXPORTAÇÃO:
 *     - O módulo exporta um objeto contendo todas as funções de serviço da API.
 *     - Opcionalmente, poderia exportar a instância `apiClient` para uso direto,
 *       mas geralmente é preferível usar as funções de serviço encapsuladas.
 *
 * Como Usar:
 * Importe este módulo em seus componentes Vue ou stores Pinia para fazer chamadas à API:
 * `import apiService from '@/services/apiService';`
 * `apiService.login('user', 'pass').then(response => { ... }).catch(error => { ... });`
 */

import axios from 'axios';

// 1. CRIAÇÃO DA INSTÂNCIA DO AXIOS
// Configura a URL base para todas as requisições e headers padrão.
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', // URL base do seu backend. Certifique-se que corresponde ao seu .env ou configuração do servidor.
  headers: {
    'Content-Type': 'application/json', // Define o tipo de conteúdo padrão para as requisições.
  },
});

// 2. INTERCEPTOR DE REQUISIÇÃO (REQUEST INTERCEPTOR)
// Este interceptor é executado ANTES de cada requisição ser enviada.
apiClient.interceptors.request.use(
  (config) => {
    // Tenta obter o token de autenticação do localStorage.
    const token = localStorage.getItem('authToken');
    if (token) {
      // Se o token existir, adiciona-o ao cabeçalho 'Authorization'.
      // O formato 'Bearer <token>' é um padrão comum para tokens JWT.
      config.headers['Authorization'] = `Bearer ${token}`;
      // Log para depuração: informa que o token foi adicionado e para qual URL.
      console.log('Interceptor de Requisição: Token JWT adicionado ao cabeçalho para', config.url);
    } else {
      // Log para depuração: informa que nenhum token foi encontrado para a URL.
      console.log('Interceptor de Requisição: Nenhum token encontrado no localStorage para', config.url);
    }
    // Retorna o objeto de configuração modificado (ou original se não houver token).
    return config;
  },
  (error) => {
    // Se ocorrer um erro durante a configuração da requisição, rejeita a promessa.
    // Isso raramente acontece nesta fase, mas é uma boa prática tratar.
    console.error('Interceptor de Requisição: Erro na configuração da requisição', error);
    return Promise.reject(error);
  }
);

// 3. INTERCEPTOR DE RESPOSTA (RESPONSE INTERCEPTOR)
// Este interceptor é executado DEPOIS que uma resposta da API é recebida,
// mas ANTES de ser processada pela chamada original (ex: .then() ou .catch()).
apiClient.interceptors.response.use(
  (response) => response, // Para respostas bem-sucedidas (status 2xx), apenas repassa a resposta.
  (error) => {
    // Verifica se o erro é uma resposta da API e se o status é 401 (Não Autorizado) ou 403 (Proibido).
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Log para depuração: indica que um erro de autenticação/autorização foi detectado.
      console.warn(`Interceptor de Resposta: Erro ${error.response.status} detectado na URL ${error.config.url}. Deslogando usuário.`);

      // Remove os dados de autenticação do localStorage, pois o token é inválido/expirado ou o usuário não tem permissão.
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');

      // Redireciona o usuário para a página de login.
      // A verificação `window.location.pathname !== '/login'` previne loops de redirecionamento
      // caso o erro 401/403 ocorra na própria tentativa de login ou em uma página acessada sem estar logado.
      if (window.location.pathname !== '/login') {
         window.location.href = '/login'; // Força recarga para a página de login.
      }
    }
    // Rejeita a promessa com o erro original. Isso permite que a lógica de tratamento de erro
    // no local da chamada da API (ex: no componente ou store) também seja executada, se necessário.
    return Promise.reject(error);
  }
);


// --- BLOCO 4: DEFINIÇÃO DAS FUNÇÕES DE SERVIÇO DA API ---
// Cada função corresponde a um endpoint específico do backend.

/**
 * @function login
 * @description Envia credenciais de usuário e senha para autenticação.
 * @param {string} username - Nome de usuário.
 * @param {string} password - Senha.
 * @returns {Promise<axios.AxiosResponse<any>>} Promessa com a resposta da API.
 * Espera-se que a resposta contenha `accessToken` e dados do `user` em caso de sucesso.
 */
const login = (username, password) => {
  return apiClient.post('/auth/login', { username, password });
};

/**
 * @function registerUser
 * @description Envia dados para registrar um novo usuário.
 * @param {object} userData - Dados do usuário (username, password, role, opcionalmente school_id).
 * @returns {Promise<axios.AxiosResponse<any>>} Promessa com a resposta da API.
 * Espera-se que a resposta contenha os dados do usuário recém-criado.
 */
const registerUser = (userData) => {
  // userData deve ser um objeto como: { username: '...', password: '...', role: '...', school_id: (opcional) }
  return apiClient.post('/users/register', userData);
};

/**
 * @function getProdutos
 * @description Busca a lista de todos os produtos.
 * A proteção desta rota (se houver) é garantida pelo interceptor de requisição que adiciona o token.
 * @returns {Promise<axios.AxiosResponse<any>>} Promessa com a lista de produtos.
 */
const getProdutos = () => {
  return apiClient.get('/produtos');
};

/**
 * @function addProduto
 * @description Envia dados para cadastrar um novo produto.
 * @param {object} produtoData - Dados do produto a ser cadastrado.
 * @returns {Promise<axios.AxiosResponse<any>>} Promessa com a resposta da API (geralmente o produto criado).
 */
const addProduto = (produtoData) => {
  return apiClient.post('/produtos', produtoData);
};

/**
 * @function deleteProduto
 * @description Envia uma requisição para excluir um produto pelo seu ID.
 * @param {number|string} id - ID do produto a ser excluído.
 * @returns {Promise<axios.AxiosResponse<any>>} Promessa com a resposta da API.
 */
const deleteProduto = (id) => {
    return apiClient.delete(`/produtos/${id}`);
}

/**
 * @function getUsers
 * @description Busca a lista de todos os usuários.
 * Esta rota é geralmente protegida e acessível apenas por administradores.
 * @returns {Promise<axios.AxiosResponse<any>>} Promessa com a lista de usuários.
 */
const getUsers = () => {
    return apiClient.get('/users');
}

/**
 * @function getSchools
 * @description Busca a lista de todas as escolas cadastradas.
 * @returns {Promise<axios.AxiosResponse<any>>} Promessa com a lista de escolas.
 */
const getSchools = () => {
  return apiClient.get('/escolas');
}

// --- BLOCO 5: EXPORTAÇÃO DO MÓDULO ---
// Exporta um objeto contendo todas as funções de serviço definidas.
export default {
  login,
  registerUser,
  getProdutos,
  addProduto,
  deleteProduto,
  getUsers,
  getSchools,
  // Opcional: exportar a instância `apiClient` se for necessário usá-la diretamente
  // em algum cenário avançado, embora geralmente seja melhor encapsular todas as chamadas
  // em funções específicas como as acima.
  // apiClient
};