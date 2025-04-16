// backend/server.js

// --- 1. Requires (Imports) ---
require('dotenv').config(); // Carrega variáveis do .env
const express = require('express');
// const sqlite3 = require('sqlite3').verbose(); // Não precisamos mais aqui se dbConnection.js faz
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Necessário para verificar/criar pasta no setupDatabase
const bcrypt = require('bcrypt'); // Necessário para hash no setupDatabase
const jwt = require('jsonwebtoken'); // Pode ser necessário se gerar tokens aqui (embora geralmente nas rotas)

// Importa a conexão centralizada com o banco de dados
const db = require('./database/dbConnection');

// Importa Middlewares e Rotas
const { authenticateToken, authorizeAdmin } = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const produtoRoutes = require('./routes/produtoRoutes');

// --- 2. Inicialização do Express ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- 3. Middlewares Globais ---
app.use(cors()); // Habilita CORS
app.use(express.json()); // Habilita parsing de JSON

// --- 4. Configuração Inicial do Banco de Dados ---
// Chama a função para criar/verificar tabelas e admin inicial
setupDatabase();

// --- 5. Definição das Rotas da API ---

// Rotas públicas (ou de autenticação) - NÃO precisam de authenticateToken aqui
app.use('/api/auth', authRoutes);

// Rotas de Produtos - Protegidas por autenticação
app.use('/api/produtos', authenticateToken, produtoRoutes);

// Rotas de Usuários (proteção interna nas rotas específicas que precisam)
app.use('/api/users', userRoutes);

// Rotas de Exemplo (manter se forem úteis para teste)
app.get('/api/dados-protegidos', authenticateToken, (req, res) => {
    res.json({ message: `Olá, ${req.user.username}! Seus dados secretos.` });
});
app.get('/api/admin/painel', authenticateToken, authorizeAdmin, (req, res) => {
    res.json({ message: `Bem-vindo ao painel de controle, Admin ${req.user.username}!` });
});

// --- REMOVIDO: Rotas de produtos duplicadas ---
// As rotas GET e POST /api/produtos agora estão dentro de ./routes/produtoRoutes.js

// --- 6. Iniciar o Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});

// --- 7. Funções Auxiliares (Setup do Banco) ---
async function setupDatabase() {
    // Verifica/cria diretório do banco (movido para cá ou pode ficar em dbConnection.js)
    const dbPath = path.resolve(__dirname, 'database', 'merenda.db');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        console.log(`Criando diretório do banco de dados em: ${dbDir}`);
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const createProdutosTableSql = `
    CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        unidade_medida TEXT NOT NULL,
        categoria TEXT NOT NULL,
        quantidade REAL,             
        valor REAL,                  
        data_vencimento TEXT,        
        data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
    );`;

    const createUsuariosTableSql = `
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
        data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
    );`;

    // Usar a instância 'db' importada de dbConnection.js
    db.serialize(() => {
        db.run(createProdutosTableSql, (err) => {
            if (err) console.error('Erro ao criar/verificar tabela "produtos":', err.message);
            else console.log('Tabela "produtos" verificada/criada com sucesso.');
        });

        db.run(createUsuariosTableSql, (err) => { // Não precisa mais async aqui se o db.get interno for
            if (err) {
                console.error('Erro ao criar/verificar tabela "usuarios":', err.message);
            } else {
                console.log('Tabela "usuarios" verificada/criada com sucesso.');
                // Criar usuário admin inicial (APENAS SE NÃO EXISTIR)
                const adminUsername = 'admin';
                const checkAdminSql = "SELECT id FROM usuarios WHERE username = ?";
                db.get(checkAdminSql, [adminUsername], async (err, row) => { // db.get pode precisar ser async/await ou usar callback
                    if (err) {
                        console.error("Erro ao verificar admin:", err.message);
                        return;
                    }
                    if (!row) {
                        console.log(`Usuário "${adminUsername}" não encontrado. Criando...`);
                        const saltRounds = 10;
                        const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'admin123';
                        try {
                            const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
                            const insertAdminSql = `INSERT INTO usuarios (username, password_hash, role) VALUES (?, ?, ?)`;
                            db.run(insertAdminSql, [adminUsername, hashedPassword, 'admin'], (insertErr) => {
                                if (insertErr) {
                                    console.error('Erro ao inserir admin inicial:', insertErr.message);
                                } else {
                                    console.log(`Usuário "${adminUsername}" criado com sucesso com role 'admin'.`);
                                    console.warn(`Senha inicial do admin: ${adminPassword} (Troque-a se necessário!)`);
                                }
                            });
                        } catch (hashError) {
                            console.error("Erro ao gerar hash da senha do admin:", hashError);
                        }
                    } else {
                        console.log(`Usuário "${adminUsername}" já existe.`);
                    }
                });
            }
        });
    });
     console.log("Setup do banco de dados concluído."); // Log para saber que terminou
}

// --- 8. Tratamento para Fechar o Banco ao Encerrar o Servidor ---
process.on('SIGINT', () => {
    console.log('Recebido SIGINT. Fechando conexão com o banco...');
    // Usa a instância 'db' importada
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar o banco de dados:', err.message);
            process.exit(1); // Sair com erro se não conseguir fechar
        } else {
            console.log('Conexão com o banco de dados fechada.');
            process.exit(0); // Sair com sucesso
        }
    });
});