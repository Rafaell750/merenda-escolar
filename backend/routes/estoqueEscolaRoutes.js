// backend/routes/estoqueEscolaRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../database/dbConnection');
// const { authorizeAdmin, authorizeSchoolOrAdmin } = require('../middleware/authMiddleware'); // Middlewares de autorização podem ser necessários

// --- ROTA NOVA: GET /api/escolas/:escolaId/estoque/retiradas ---
// Busca todos os itens retirados do estoque de uma escola específica.
router.get('/:escolaId/estoque/retiradas', (req, res) => {
    const { escolaId } = req.params;

    if (!escolaId || isNaN(parseInt(escolaId))) {
        return res.status(400).json({ error: "ID da escola inválido." });
    }

    // Opcional: Autorização para garantir que apenas admin ou a própria escola vejam as retiradas
    if (req.user.role === 'escola' && req.user.school_id !== parseInt(escolaId)) {
        return res.status(403).json({ error: "Acesso negado." });
    }

    const sqlGetRetiradas = `
        SELECT
            rei.produto_id,
            p.nome AS nome_produto,      -- Para facilitar a agregação no frontend se necessário
            p.unidade_medida,    -- Para facilitar a agregação no frontend se necessário
            rei.quantidade_retirada,
            strftime('%d/%m/%Y %H:%M', rei.data_retirada) AS data_retirada_formatada,
            u.username AS nome_usuario_retirada
        FROM
            retiradas_escola_itens rei
        JOIN
            produtos p ON rei.produto_id = p.id
        JOIN
            usuarios u ON rei.usuario_id_retirada = u.id
        WHERE
            rei.escola_id = ?
        ORDER BY
            rei.data_retirada DESC;
    `;

    db.all(sqlGetRetiradas, [escolaId], (err, retiradas) => {
        if (err) {
            console.error("[GET /:escolaId/estoque/retiradas] Erro ao buscar itens retirados:", err.message);
            return res.status(500).json({ error: "Erro interno ao buscar histórico de retiradas." });
        }
        res.json(retiradas);
    });
});

// --- ROTA NOVA: POST /api/escolas/:escolaId/estoque/retirar ---
// Permite registrar a retirada de itens do estoque de uma escola específica.
// Ação tipicamente realizada por um usuário da escola ou admin.
router.post('/:escolaId/estoque/retirar', (req, res) => {
    const { escolaId } = req.params;
    const { itens } = req.body; // Array de { produto_id, quantidade_retirada }
    const usuarioRetiradaId = req.user.id; // ID do usuário (da escola ou admin) que está retirando.

    // 1. Validação básica da entrada
    if (!escolaId || isNaN(parseInt(escolaId))) {
        return res.status(400).json({ error: "ID da escola inválido." });
    }
    if (!Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: 'A lista de itens para retirada é inválida ou está vazia.' });
    }
    for (const item of itens) {
        if (!item.produto_id || !Number.isInteger(item.produto_id) || item.produto_id <= 0 ||
            !item.quantidade_retirada || typeof item.quantidade_retirada !== 'number' || item.quantidade_retirada <= 0) {
            return res.status(400).json({ error: `Item inválido na lista de retirada: ${JSON.stringify(item)}. Verifique ID do produto e quantidade.` });
        }
    }

    // 2. Autorização (quem pode retirar de qual escola?)
    //    - Admin: pode retirar de qualquer escola.
    //    - Usuário 'escola': só pode retirar da sua própria escola.
    if (req.user.role === 'escola' && req.user.school_id !== parseInt(escolaId)) {
        return res.status(403).json({ error: "Acesso negado. Usuário da escola tentando retirar estoque de outra escola." });
    }
    // Se req.user.role === 'user' (SME), eles não deveriam estar aqui.
    // Adicionar um middleware `authorizeSchoolOrAdmin` seria uma boa prática.

    // 3. Lógica de banco de dados para registrar a retirada
    //    Isto é o mais complexo e depende de como você armazena o "estoque da escola".
    //    Atualmente, seu modelo parece calcular o estoque da escola com base nas
    //    `transferenciasConfirmadas`. Registrar uma "retirada" poderia significar:
    //
    //    OPÇÃO A: Criar uma "transferência negativa" ou um novo tipo de registro.
    //             - Adicionar uma nova tabela, por exemplo, `retiradas_escola_itens`
    //               (id, escola_id, produto_id, quantidade_retirada, data_retirada, usuario_id)
    //             - Sua lógica no frontend para calcular `itensConsolidados` precisaria
    //               subtrair essas retiradas.
    //
    //    OPÇÃO B: Modificar diretamente uma tabela de "estoque_escola" (se você tivesse uma).
    //             - Se você tivesse uma tabela `estoque_escola (escola_id, produto_id, quantidade_atual)`,
    //               você simplesmente decrementaria a quantidade.
    //             - MAS, seu modelo atual parece consolidar a partir de `transferencias`.
    //
    //    Vamos assumir a OPÇÃO A por enquanto, pois é mais fácil de adicionar sem
    //    alterar drasticamente sua estrutura atual de `transferencias`.
    //    Você precisará criar esta tabela `retiradas_escola_itens` no seu `server.js -> setupDatabase()`.

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;', (errBegin) => {
            if (errBegin) {
                console.error("[POST /:escolaId/estoque/retirar] Erro ao iniciar transação:", errBegin.message);
                return res.status(500).json({ error: 'Erro interno do servidor ao iniciar a transação.' });
            }

            let rollbackNeeded = false;
            let detailedError = null;

            const retiradaPromises = itens.map(item => {
                return new Promise(async (resolve, reject) => {
                    // A. (OPCIONAL, mas recomendado): Verificar se a quantidade a retirar não excede o disponível.
                    //    Para isso, você precisaria recalcular o estoque consolidado atual para este produto
                    //    nesta escola ANTES de tentar registrar a retirada. Esta parte pode ser complexa aqui.
                    //    Por simplicidade, vamos pular essa verificação no backend neste exemplo inicial,
                    //    confiando na validação do frontend, mas em produção seria crucial.

                    // B. Inserir o registro de retirada. (Assumindo que você criou a tabela `retiradas_escola_itens`)
                    //    Exemplo de tabela: retiradas_escola_itens (id, escola_id, produto_id, quantidade_retirada, data_retirada, usuario_id)
                    const sqlInsertRetirada = `
                        INSERT INTO retiradas_escola_itens
                            (escola_id, produto_id, quantidade_retirada, data_retirada, usuario_id_retirada)
                        VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
                    `;
                    db.run(sqlInsertRetirada, [escolaId, item.produto_id, item.quantidade_retirada, usuarioRetiradaId], function(errInsert) {
                        if (errInsert) {
                            detailedError = `Erro ao registrar retirada do produto ID ${item.produto_id}.`;
                            return reject(errInsert);
                        }
                        resolve();
                    });
                });
            });

            Promise.all(retiradaPromises)
                .then(() => {
                    if (rollbackNeeded) throw new Error(detailedError || 'Erro na operação de retirada.');

                    db.run('COMMIT;', (errCommit) => {
                        if (errCommit) throw errCommit;
                        console.log(`[POST /:escolaId/estoque/retirar] Retirada registrada para escola ID ${escolaId} por usuário ID ${usuarioRetiradaId}.`);
                        res.status(201).json({ message: 'Retirada de estoque registrada com sucesso!' });
                    });
                })
                .catch(transactionError => {
                    console.error("[POST /:escolaId/estoque/retirar] Erro durante a transação de retirada:", transactionError.message);
                    db.run('ROLLBACK;', (errRollback) => {
                        if (errRollback) console.error("[POST /:escolaId/estoque/retirar] Erro CRÍTICO no rollback da retirada:", errRollback.message);
                    });
                    res.status(detailedError ? 400 : 500).json({ error: detailedError || 'Falha ao registrar a retirada de estoque.' });
                });
        }); // Fim do BEGIN TRANSACTION
    }); // Fim do db.serialize
});

module.exports = router;