// backend/services/historicoService.js

const db = require('../database/dbConnection');

/**
 * Registra uma ação no histórico de um produto.
 * @param {number} produto_id - ID do produto.
 * @param {string} produto_nome_snapshot - Nome do produto no momento da ação.
 * @param {string} acao - Tipo da ação ('CRIACAO', 'EDICAO', 'EXCLUSAO', 'REABASTECIMENTO').
 * @param {string|null} detalhes - Descrição da alteração.
 * @param {number|null} usuario_id - ID do usuário que realizou a ação.
 * @param {string|null} usuario_username_snapshot - Nome do usuário.
 */
function registrarAcaoProduto(produto_id, produto_nome_snapshot, acao, detalhes, usuario_id, usuario_username_snapshot) {
    const sql = `
        INSERT INTO produto_historico 
            (produto_id, produto_nome_snapshot, acao, detalhes, usuario_id, usuario_username_snapshot)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [produto_id, produto_nome_snapshot, acao, detalhes, usuario_id, usuario_username_snapshot], (err) => {
        if (err) {
            console.error(`Falha ao registrar ação de histórico para o produto ID ${produto_id}:`, err.message);
        } else {
            console.log(`Ação '${acao}' registrada para o produto ID ${produto_id} por '${usuario_username_snapshot}'.`);
        }
    });
}

module.exports = { registrarAcaoProduto };