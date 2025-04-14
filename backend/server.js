// backend/server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose(); // .verbose() para mensagens de erro mais detalhadas
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Porta para o backend rodar

// --- Middlewares ---
app.use(cors()); // Habilita CORS para permitir requisições do frontend
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições

// --- Configuração do Banco de Dados SQLite ---
const dbPath = path.resolve(__dirname, 'database', 'merenda.db');
// Cria a pasta 'database' se ela não existir (melhoria)
const dbDir = path.dirname(dbPath);
const fs = require('fs');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        // Criar a tabela de produtos se ela não existir
        createTable();
    }
});

// Função para criar a tabela
function createTable() {
    const createTableSql = `
    CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        unidade_medida TEXT NOT NULL, -- Usando snake_case para colunas SQL
        categoria TEXT NOT NULL,
        data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP -- Data/Hora do cadastro
    );
    `;
    db.run(createTableSql, (err) => {
        if (err) {
            console.error('Erro ao criar tabela "produtos":', err.message);
        } else {
            console.log('Tabela "produtos" verificada/criada com sucesso.');
        }
    });
}

// --- Rotas da API ---

// Rota POST para cadastrar um novo produto
app.post('/api/produtos', (req, res) => {
    const { nome, descricao, unidadeMedida, categoria } = req.body; // Recebe dados do frontend

    // Validação simples no backend
    if (!nome || !unidadeMedida || !categoria) {
        return res.status(400).json({ error: 'Campos obrigatórios (nome, unidadeMedida, categoria) não fornecidos.' });
    }

    const insertSql = `
    INSERT INTO produtos (nome, descricao, unidade_medida, categoria)
    VALUES (?, ?, ?, ?)
    `;
    // Os nomes das colunas aqui devem corresponder aos da tabela (snake_case)
    // Os valores vêm do req.body (camelCase, mas usamos os valores)
    const params = [nome, descricao, unidadeMedida, categoria];

    // Usar function() regular para ter acesso ao 'this' (para lastID)
    db.run(insertSql, params, function(err) {
        if (err) {
            console.error('Erro ao inserir produto:', err.message);
            return res.status(500).json({ error: 'Erro interno ao cadastrar o produto.' });
        }
        // Sucesso! Retorna o produto recém-criado com o ID
        res.status(201).json({
            id: this.lastID, // ID gerado pelo SQLite
            nome: nome,
            descricao: descricao,
            unidade_medida: unidadeMedida,
            categoria: categoria
        });
    });
});

// Rota GET para buscar todos os produtos (ORDENADOS!)
app.get('/api/produtos', (req, res) => {
    // Ordenar por ID decrescente para mostrar os mais recentes primeiro
    const sql = "SELECT * FROM produtos ORDER BY id DESC";

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar produtos:', err.message);
            return res.status(500).json({ error: 'Erro interno ao buscar produtos.' });
        }
        res.status(200).json(rows); // Retorna a lista de produtos
    });
});


// Rota POST para cadastrar um novo produto (GARANTIR RETORNO COMPLETO)
app.post('/api/produtos', (req, res) => {
    const { nome, descricao, unidadeMedida, categoria } = req.body;

    if (!nome || !unidadeMedida || !categoria) {
        return res.status(400).json({ error: 'Campos obrigatórios (nome, unidadeMedida, categoria) não fornecidos.' });
    }

    const insertSql = `
    INSERT INTO produtos (nome, descricao, unidade_medida, categoria)
    VALUES (?, ?, ?, ?)
    `;
    const params = [nome, descricao, unidadeMedida, categoria];

    // Usar function() regular para ter acesso ao 'this'
    db.run(insertSql, params, function(err) {
        if (err) {
            console.error('Erro ao inserir produto:', err.message);
            return res.status(500).json({ error: 'Erro interno ao cadastrar o produto.' });
        }
        // Buscar o produto recém-inserido para retornar todos os dados (incluindo data_cadastro)
        const selectSql = "SELECT * FROM produtos WHERE id = ?";
        db.get(selectSql, [this.lastID], (selectErr, row) => {
             if (selectErr) {
                 console.error('Erro ao buscar produto recém-criado:', selectErr.message);
                 // Mesmo com erro aqui, o produto foi criado. Retornar o básico.
                 return res.status(201).json({
                     id: this.lastID, nome, descricao, unidade_medida: unidadeMedida, categoria
                 });
             }
             // Retorna o objeto completo do produto criado
             res.status(201).json(row);
        });
    });
});

// --- Iniciar o Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});

// --- Tratamento para Fechar o Banco ao Encerrar o Servidor ---
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar o banco de dados:', err.message);
        } else {
            console.log('Conexão com o banco de dados fechada.');
        }
        process.exit(0);
    });
});