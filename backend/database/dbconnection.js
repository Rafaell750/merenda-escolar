// Crie o arquivo backend/database/dbConnection.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'merenda.db'); // Assumindo que está na pasta 'database'
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true }); // Cria recursivamente se necessário
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
        // Considerar encerrar a aplicação se o DB falhar aqui?
        // process.exit(1);
    } else {
        console.log('Conectado ao banco de dados SQLite a partir do dbConnection.');
    }
});

module.exports = db; // Exporta a instância do banco