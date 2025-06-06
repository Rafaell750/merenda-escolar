// backend/server.js

/**
 * Visão Geral:
 * Este é o arquivo principal do servidor backend da aplicação de estoque escolar.
 * Ele utiliza o framework Express.js para criar e gerenciar a API RESTful.
 * Responsável por:
 *   - Carregar variáveis de ambiente.
 *   - Inicializar o Express.
 *   - Configurar middlewares globais (CORS, parsing de JSON).
 *   - Estabelecer a conexão com o banco de dados SQLite3 e realizar o setup inicial
 *     (criação de tabelas e usuário admin padrão, se não existirem).
 *   - Definir e montar as rotas da API para diferentes recursos (autenticação,
 *     usuários, produtos, escolas, transferências).
 *   - Aplicar middlewares de autenticação e autorização às rotas protegidas.
 *   - Iniciar o servidor para escutar requisições na porta configurada.
 *   - Tratar o encerramento gracioso do servidor, fechando a conexão com o banco.
 *
 * Interação com o Frontend:
 * Este servidor backend interage diretamente com vários componentes e serviços do frontend:
 * - `/api/auth`:
 *   - `LoginView.vue`: Para autenticar usuários (`POST /api/auth/login`).
 * - `/api/users`:
 *   - `RegisterUserView.vue`: Para registrar novos usuários (`POST /api/users/register`) e
 *     listar usuários existentes (`GET /api/users`, acessível por admin).
 * - `/api/produtos`:
 *   - `ProdutosView.vue`: Para listar (`GET`), adicionar (`POST`), atualizar (`PUT`),
 *     e excluir (`DELETE`) produtos.
 *   - `EnviarEstoqueModal.vue` (indiretamente, pois o modal passa dados para `ProdutosView.vue`
 *     que pode então interagir com o backend para atualizar estoque após envio).
 * - `/api/escolas`:
 *   - `PainelControleView.vue` (na parte de escolas): Para listar (`GET`), adicionar (`POST`),
 *     atualizar (`PUT`), e excluir (`DELETE`) escolas.
 *   - `EscolaDetalhesView.vue`: Para buscar detalhes de uma escola específica (`GET /api/escolas/:id`).
 *   - `RegisterUserView.vue`: Para listar escolas no dropdown quando se cadastra um usuário do tipo 'escola'.
 * - `/api/transferencias`:
 *   - `EnviarEstoqueModal.vue` (via `ProdutosView.vue`): Para registrar novas transferências de estoque
 *     da SME para uma escola (`POST /api/transferencias`).
 *   - `ConfirmarRecebimentoModal.vue` (via `EscolaDetalhesView.vue`): Para buscar transferências
 *     pendentes (`GET /api/transferencias/pendentes/por-escola/:id`) e confirmar o recebimento
 *     de itens (`POST /api/transferencias/:id/confirmar-item` ou similar).
 *   - `EscolaDetalhesView.vue`: Para buscar o histórico de transferências confirmadas para
 *     uma escola (`GET /api/transferencias/confirmadas/por-escola/:id`).
 *   - `RetirarEstoqueModal.vue` (via `EscolaDetalhesView.vue`): Para registrar a retirada de
 *     itens do estoque da escola (pode envolver um endpoint como `POST /api/transferencias/retirada`
 *     ou uma lógica de "transferência negativa").
 *
 * Middlewares Utilizados:
 * - `cors`: Habilita Cross-Origin Resource Sharing.
 * - `express.json`: Faz o parsing de corpos de requisição no formato JSON.
 * - `./middleware/authMiddleware.js`:
 *   - `authenticateToken`: Verifica a validade do token JWT em rotas protegidas.
 *   - `authorizeAdmin`: Verifica se o usuário autenticado tem o papel de 'admin'.
 *
 * Estrutura do Banco de Dados (Tabelas Criadas/Verificadas):
 * - `produtos`: Armazena informações sobre os produtos.
 * - `usuarios`: Armazena dados dos usuários, incluindo hash da senha e papel.
 * - `escolas`: Armazena informações sobre as escolas.
 * - `transferencias`: Registra as transferências de estoque entre SME e escolas.
 * - `transferencia_itens`: Detalha os produtos e quantidades em cada transferência.
 * - (Opcional) Trigger `update_produto_modificacao`: Atualiza automaticamente o campo
 *   `data_modificacao` na tabela `produtos` quando certas colunas são alteradas.
 */

// --- BLOCO 1: IMPORTS E CONFIGURAÇÕES INICIAIS ---
require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env para process.env
const express = require('express');
const cors = require('cors'); // Middleware para habilitar CORS (Cross-Origin Resource Sharing)
const path = require('path'); // Módulo para trabalhar com caminhos de arquivos e diretórios
const fs = require('fs'); // Módulo File System, usado para verificar/criar diretório do banco
const bcrypt = require('bcrypt'); // Biblioteca para hashing de senhas (usado no setup do admin)
// const jwt = require('jsonwebtoken'); // Não diretamente usado aqui, mas nas rotas de autenticação

// Importa a conexão centralizada com o banco de dados (instância do SQLite3)
const db = require('./database/dbConnection');

// Importa os módulos de rotas específicos para cada recurso da API
const transferenciaRoutes = require('./routes/transferenciaRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const escolaRoutes = require('./routes/escolaRoutes');
const estoqueEscolaRoutes = require('./routes/estoqueEscolaRoutes');

// Importa middlewares de autenticação e autorização
const { authenticateToken, authorizeAdmin } = require('./middleware/authMiddleware');


// --- BLOCO 2: INICIALIZAÇÃO DA APLICAÇÃO EXPRESS ---
const app = express(); // Cria uma instância da aplicação Express
const PORT = process.env.PORT || 3000; // Define a porta do servidor, priorizando a variável de ambiente

// --- BLOCO 3: MIDDLEWARES GLOBAIS DA APLICAÇÃO ---
app.use(cors()); // Habilita CORS para permitir requisições de diferentes origens (ex: frontend em outra porta)
app.use(express.json()); // Middleware para fazer o parsing de corpos de requisição no formato JSON

// --- BLOCO 4: SETUP INICIAL DO BANCO DE DADOS ---
// Chama a função assíncrona `setupDatabase` para criar/verificar as tabelas
// e o usuário administrador inicial.
setupDatabase();

// --- BLOCO 5: DEFINIÇÃO E MONTAGEM DAS ROTAS DA API ---
// As rotas são agrupadas por recurso e montadas sob um prefixo de URL (ex: /api/auth).

// Rotas públicas ou de autenticação (não requerem `authenticateToken` globalmente aqui)
app.use('/api/auth', authRoutes); // Ex: /api/auth/login

// Rotas de Produtos - Protegidas pelo middleware `authenticateToken`
// Todas as rotas definidas em `produtoRoutes` serão prefixadas com /api/produtos
// e exigirão um token JWT válido.
app.use('/api/produtos', authenticateToken, produtoRoutes);

// Rotas de Escolas - Protegidas pelo middleware `authenticateToken`
app.use('/api/escolas', authenticateToken, escolaRoutes);

// Rotas de Transferências - Protegidas pelo middleware `authenticateToken`
app.use('/api/transferencias', authenticateToken, transferenciaRoutes);

// Rotas de Usuários - A proteção é geralmente aplicada internamente em `userRoutes`
// para rotas específicas (ex: listar todos os usuários só para admin).
// `/api/users/register` pode ser acessado por admin (verificado dentro da rota).
app.use('/api/users', userRoutes);

app.use('/api/escolas', authenticateToken, estoqueEscolaRoutes);

// Rotas de Exemplo (podem ser mantidas para testes ou removidas)
app.get('/api/dados-protegidos', authenticateToken, (req, res) => {
    // `req.user` é adicionado pelo middleware `authenticateToken` com os dados do token decodificado
    res.json({ message: `Olá, ${req.user.username}! Seus dados secretos.` });
});
app.get('/api/admin/painel', authenticateToken, authorizeAdmin, (req, res) => {
    // Esta rota requer autenticação E que o usuário tenha o papel 'admin'
    res.json({ message: `Bem-vindo ao painel de controle, Admin ${req.user.username}!` });
});

// SEM BLOCO NO Momento
app.use('/api/escolas', authenticateToken, escolaRoutes); // Rotas de escolas existentes
app.use('/api/escolas', authenticateToken, estoqueEscolaRoutes); // Adiciona as novas rotas de estoque da escola


// --- BLOCO 6: INÍCIO DO SERVIDOR ---
// O servidor começa a escutar por requisições HTTP na porta definida.
app.listen(PORT, () => {
    console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});

// --- BLOCO 7: FUNÇÃO AUXILIAR PARA CONFIGURAÇÃO DO BANCO DE DADOS ---
/**
 * @async
 * @function setupDatabase
 * @description Configura o banco de dados SQLite.
 * Verifica/cria o diretório do banco de dados.
 * Cria as tabelas `produtos`, `usuarios`, `escolas`, `transferencias`, `transferencia_itens`
 * se elas não existirem.
 * Cria um trigger opcional para atualizar `data_modificacao` na tabela `produtos`.
 * Cria um usuário administrador inicial ('admin') com senha padrão se não existir.
 */
async function setupDatabase() {
    // Verifica/cria o diretório para o arquivo do banco de dados
    const dbPath = path.resolve(__dirname, 'database', 'merenda.db'); // Caminho absoluto para o arquivo .db
    const dbDir = path.dirname(dbPath); // Diretório onde o arquivo .db está/estará
    if (!fs.existsSync(dbDir)) { // Se o diretório não existe
        console.log(`Criando diretório do banco de dados em: ${dbDir}`);
        fs.mkdirSync(dbDir, { recursive: true }); // Cria o diretório recursivamente
    }

    // Definições SQL para criar as tabelas
    const createProdutosTableSql = `
    CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        unidade_medida TEXT NOT NULL,
        categoria TEXT NOT NULL,
        quantidade REAL NOT NULL,
        quantidade_referencia_alerta REAL DEFAULT 0,            
        valor REAL,                  
        data_vencimento TEXT,        
        data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_modificacao DATETIME DEFAULT CURRENT_TIMESTAMP
    );`;

    const createUsuariosTableSql = `
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user', 'escola')), -- Papéis permitidos
        school_id INTEGER NULL, -- ID da escola, se o papel for 'escola'
        data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES escolas(id) ON DELETE SET NULL ON UPDATE CASCADE
        -- Se uma escola for deletada, o school_id dos usuários associados se torna NULL.
        -- Se o ID de uma escola for atualizado, o school_id dos usuários é atualizado.
    );`;

    const createEscolasTableSql = `
    CREATE TABLE IF NOT EXISTS escolas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE,
        endereco TEXT,
        responsavel TEXT,
        data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
    );`;

    const createTransferenciasTableSql = `
    CREATE TABLE IF NOT EXISTS transferencias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        escola_id INTEGER NOT NULL,
        data_transferencia DATETIME DEFAULT CURRENT_TIMESTAMP, -- Data do envio pela SME
        usuario_id INTEGER NOT NULL, -- ID do usuário da SME que realizou o envio
        data_recebimento_confirmado DATETIME NULL, -- Data da confirmação de recebimento pela escola
        usuario_confirmacao_id INTEGER DEFAULT NULL,
        FOREIGN KEY (escola_id) REFERENCES escolas (id) ON DELETE CASCADE,
        -- ON DELETE CASCADE: Se uma escola for excluída, suas transferências associadas também são.
        -- Considere ON DELETE RESTRICT ou SET NULL dependendo da regra de negócio.
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT
        -- ON DELETE RESTRICT: Impede a exclusão de um usuário se ele tiver transferências registradas.
    );`;

    const createTransferenciaItensTableSql = `
    CREATE TABLE IF NOT EXISTS transferencia_itens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transferencia_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        quantidade_enviada REAL NOT NULL,
        FOREIGN KEY (transferencia_id) REFERENCES transferencias (id) ON DELETE CASCADE,
        -- Se uma transferência for excluída, seus itens também são.
        FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE RESTRICT
        -- Impede a exclusão de um produto se ele estiver em algum item de transferência.
    );`;

    const createRetiradasEscolaItensTableSql = `
    CREATE TABLE IF NOT EXISTS retiradas_escola_itens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        escola_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        quantidade_retirada REAL NOT NULL,
        data_retirada DATETIME DEFAULT CURRENT_TIMESTAMP,
        usuario_id_retirada INTEGER NOT NULL, 
        FOREIGN KEY (escola_id) REFERENCES escolas (id) ON DELETE CASCADE,
        FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE RESTRICT,
        FOREIGN KEY (usuario_id_retirada) REFERENCES usuarios (id) ON DELETE RESTRICT
    );`;

    // Trigger opcional para atualizar data_modificacao na tabela 'produtos'
    // Este trigger é acionado após um UPDATE na tabela 'produtos',
    // se o nome ou a quantidade do produto forem alterados.
    const createUpdateTimestampTriggerSql = `
    CREATE TRIGGER IF NOT EXISTS update_produto_modificacao
    AFTER UPDATE ON produtos
    FOR EACH ROW
    WHEN OLD.quantidade <> NEW.quantidade OR OLD.nome <> NEW.nome -- Adicione outras colunas aqui se a modificação delas também deve atualizar o timestamp
    BEGIN
        UPDATE produtos SET data_modificacao = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;`;

    // Utiliza a instância 'db' importada de dbConnection.js para executar os comandos SQL.
    // `db.serialize` garante que os comandos sejam executados em sequência.
    db.serialize(() => {
        db.run(createProdutosTableSql, (err) => {
            if (err) console.error('Erro ao criar/verificar tabela "produtos":', err.message);
            else console.log('Tabela "produtos" verificada/criada com sucesso.');
        });

        db.run(createEscolasTableSql, (err) => {
            if (err) console.error('Erro ao criar/verificar tabela "escolas":', err.message);
            else console.log('Tabela "escolas" verificada/criada com sucesso.');
        });

        // Criação/verificação da tabela de usuários e admin inicial
        db.run(createUsuariosTableSql, (err) => {
            if (err) {
                console.error('Erro ao criar/verificar tabela "usuarios":', err.message);
            } else {
                console.log('Tabela "usuarios" verificada/criada com sucesso.');
                // Lógica para criar o usuário administrador inicial se não existir
                const adminUsername = process.env.ADMIN_INITIAL_USERNAME || 'admin';
                const checkAdminSql = "SELECT id FROM usuarios WHERE username = ?";
                db.get(checkAdminSql, [adminUsername], async (err, row) => {
                    if (err) {
                        console.error("Erro ao verificar usuário admin:", err.message);
                        return;
                    }
                    if (!row) { // Se o admin não existir
                        console.log(`Usuário "${adminUsername}" não encontrado. Criando...`);
                        const saltRounds = 10; // Custo do hashing
                        const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'admin123'; // Senha padrão
                        try {
                            const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
                            const insertAdminSql = `INSERT INTO usuarios (username, password_hash, role) VALUES (?, ?, ?)`;
                            db.run(insertAdminSql, [adminUsername, hashedPassword, 'admin'], (insertErr) => {
                                if (insertErr) {
                                    console.error('Erro ao inserir usuário admin inicial:', insertErr.message);
                                } else {
                                    console.log(`Usuário "${adminUsername}" criado com sucesso com papel 'admin'.`);
                                    console.warn(`ATENÇÃO: A senha inicial do administrador é "${adminPassword}". Recomenda-se alterá-la em um ambiente de produção.`);
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
                
        db.run(createTransferenciasTableSql, (err) => {
            if (err) console.error('Erro ao criar/verificar tabela "transferencias":', err.message);
            else console.log('Tabela "transferencias" verificada/criada com sucesso.');
        });

        db.run(createTransferenciaItensTableSql, (err) => {
            if (err) console.error('Erro ao criar/verificar tabela "transferencia_itens":', err.message);
            else console.log('Tabela "transferencia_itens" verificada/criada com sucesso.');
        });
        
        db.run(createUpdateTimestampTriggerSql, (err) => {
             if (err) console.error('Erro ao criar/verificar trigger "update_produto_modificacao":', err.message);
             else console.log('Trigger "update_produto_modificacao" verificado/criado com sucesso.');
         });
        db.run(createRetiradasEscolaItensTableSql, (err) => {
            if (err) console.error('Erro ao criar/verificar tabela "retiradas_escola_itens":', err.message);
            else console.log('Tabela "retiradas_escola_itens" verificada/criada com sucesso.');
        });
    });
     console.log("Setup do banco de dados (verificação/criação de tabelas) concluído.");
}

// --- BLOCO 8: TRATAMENTO PARA FECHAMENTO GRACIOSO DO BANCO ---
// Ouve o sinal SIGINT (geralmente Ctrl+C no terminal) para fechar a conexão com o banco
// antes de encerrar o processo do servidor.
process.on('SIGINT', () => {
    console.log('Sinal SIGINT recebido. Fechando conexão com o banco de dados...');
    db.close((err) => { // Utiliza a instância 'db' importada
        if (err) {
            console.error('Erro ao fechar a conexão com o banco de dados:', err.message);
            process.exit(1); // Encerra o processo com código de erro
        } else {
            console.log('Conexão com o banco de dados fechada com sucesso.');
            process.exit(0); // Encerra o processo com sucesso
        }
    });
});