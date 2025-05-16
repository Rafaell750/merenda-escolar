// backend/database/dbConnection.js

/**
 * Visão Geral:
 * Este módulo é responsável por estabelecer e gerenciar a conexão com o banco
 * de dados SQLite3 da aplicação. Ele centraliza a criação da instância do banco,
 * garantindo que apenas uma conexão seja aberta e reutilizada por toda a aplicação
 * backend (padrão Singleton para a conexão).
 *
 * Funcionalidades Principais:
 * 1.  IMPORTAÇÃO DE DEPENDÊNCIAS:
 *     - `sqlite3`: Driver Node.js para interagir com bancos de dados SQLite.
 *       O `.verbose()` pode ser usado para obter stack traces mais detalhados
 *       em caso de erros, útil durante o desenvolvimento.
 *     - `path`: Módulo Node.js para manipular caminhos de arquivos e diretórios
 *       de forma independente do sistema operacional.
 *     - `fs` (File System): Módulo Node.js para interagir com o sistema de arquivos,
 *       usado aqui para verificar e criar o diretório do banco de dados se necessário.
 * 2.  DEFINIÇÃO DO CAMINHO DO BANCO DE DADOS:
 *     - `dbPath`: Determina o caminho absoluto para o arquivo `merenda.db`.
 *       O arquivo é esperado estar dentro de um diretório chamado `database`
 *       (mesmo nível que `dbConnection.js`).
 *     - `dbDir`: Obtém o caminho do diretório onde o arquivo do banco de dados
 *       deverá residir.
 * 3.  CRIAÇÃO DO DIRETÓRIO DO BANCO (SE NÃO EXISTIR):
 *     - Verifica se o `dbDir` existe.
 *     - Se não existir, cria o diretório recursivamente usando `fs.mkdirSync`.
 *       Isso garante que a aplicação possa criar o banco de dados mesmo que a
 *       pasta `database` não tenha sido criada manualmente.
 * 4.  CRIAÇÃO E ABERTURA DA CONEXÃO COM O BANCO:
 *     - `db = new sqlite3.Database(dbPath, callback)`: Cria uma nova instância
 *       do banco de dados SQLite, conectando-se ao arquivo especificado em `dbPath`.
 *       Se o arquivo não existir, o SQLite tentará criá-lo.
 *     - O callback da função `Database` é executado após a tentativa de conexão:
 *         - Se houver erro (`err`), uma mensagem é logada no console.
 *           (Comentado: `process.exit(1)` poderia ser usado para encerrar a aplicação
 *           se a conexão com o banco for crítica para o funcionamento).
 *         - Se a conexão for bem-sucedida, uma mensagem de sucesso é logada.
 * 5.  EXPORTAÇÃO DA INSTÂNCIA DO BANCO:
 *     - `module.exports = db;`: Exporta a instância `db` da conexão com o banco.
 *       Isso permite que outros módulos do backend (como `server.js` e os arquivos
 *       de rotas) importem e utilizem esta mesma instância para interagir com o
 *       banco de dados.
 *
 * Como Usar:
 * Em outros arquivos do backend (ex: `server.js`, `produtoRoutes.js`):
 * ```javascript
 * const db = require('./database/dbConnection'); // Ajuste o caminho conforme necessário
 *
 * // Exemplo de uso:
 * db.run("INSERT INTO ...");
 * db.get("SELECT * FROM ...");
 * db.all("SELECT * FROM ...");
 * ```
 *
 * Interação com Frontend:
 * Este arquivo é puramente do backend e não interage diretamente com o frontend.
 * No entanto, ele é crucial para o funcionamento de todas as rotas da API
 * que, por sua vez, são consumidas pelo frontend. A saúde desta conexão é
 * fundamental para que o frontend possa buscar e enviar dados.
 */

// 1. Importa as bibliotecas necessárias.
const sqlite3 = require('sqlite3').verbose(); // Driver SQLite3. `.verbose()` para stack traces mais detalhados.
const path = require('path');                 // Módulo para lidar com caminhos de arquivos.
const fs = require('fs');                     // Módulo File System para interagir com o sistema de arquivos.

// 2. Define o caminho para o arquivo do banco de dados.
// `__dirname` é o diretório do arquivo atual (ou seja, backend/database/).
// `path.resolve` cria um caminho absoluto.
// O arquivo 'merenda.db' será localizado ou criado dentro da pasta 'database'.
const dbPath = path.resolve(__dirname, 'merenda.db'); // Assumindo que está na pasta 'database'
// Obtém o caminho para o diretório onde o arquivo do banco de dados deve estar.
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true }); // Cria recursivamente se necessário
}

// 3. Verifica e cria o diretório do banco de dados, se não existir.
// Isso é útil para o primeiro setup ou se a pasta 'database' for acidentalmente excluída.
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite a partir do dbConnection.');
    }
});

module.exports = db; // Exporta a instância do banco