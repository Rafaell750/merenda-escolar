// backend/routes/produtoRoutes.js
const express = require('express');
const db = require('../database/dbConnection');
const router = express.Router();

// POST /api/produtos - Cadastrar
router.post('/', (req, res) => {
    // Destrutura os novos campos do corpo da requisição
    const { nome, descricao, unidadeMedida, categoria, quantidade, valor, data_vencimento } = req.body;

    // --- Validação básica (MELHORAR CONFORME NECESSÁRIO) ---
    if (!nome || !unidadeMedida || !categoria) {
        return res.status(400).json({ error: 'Nome, Unidade de Medida e Categoria são obrigatórios.' });
    }
    // Validações opcionais para os novos campos
    if (quantidade !== undefined && (isNaN(parseFloat(quantidade)) || parseFloat(quantidade) < 0)) {
        return res.status(400).json({ error: 'Quantidade inválida. Deve ser um número não negativo.' });
    }
    if (valor !== undefined && (isNaN(parseFloat(valor)) || parseFloat(valor) < 0)) {
        return res.status(400).json({ error: 'Valor inválido. Deve ser um número não negativo.' });
    }
    // Poderia adicionar validação de formato para data_vencimento (ex: regex para YYYY-MM-DD)

    // ATUALIZADO: Inclui os novos campos no INSERT
    const insertSql = `
        INSERT INTO produtos (nome, descricao, unidade_medida, categoria, quantidade, valor, data_vencimento)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // ATUALIZADO: Adiciona os novos valores aos parâmetros
    db.run(insertSql, [
        nome,
        descricao,
        unidadeMedida, // Nome no frontend é unidadeMedida
        categoria,
        quantidade !== undefined ? parseFloat(quantidade) : null, // Converte para número ou usa null
        valor !== undefined ? parseFloat(valor) : null,          // Converte para número ou usa null
        data_vencimento || null // Usa o valor ou null se não for enviado
    ], function (err) {
        if (err) {
            console.error(`Erro ao cadastrar produto ${nome}:`, err.message);
            // Verificar erro de constraint (ex: UNIQUE, NOT NULL - embora nome, unid, cat já sejam validados)
            if (err.message.includes('NOT NULL constraint failed')) {
                 return res.status(400).json({ error: 'Erro de dados: Verifique os campos obrigatórios.' });
            }
            return res.status(500).json({ error: 'Erro interno ao cadastrar produto.' });
        }
        // Busca o produto recém-inserido para retornar o objeto completo
        db.get("SELECT * FROM produtos WHERE id = ?", [this.lastID], (selectErr, row) => {
            if (selectErr) {
                console.error("Erro ao buscar produto recém-cadastrado:", selectErr.message);
                // Mesmo com erro aqui, o produto foi inserido. Retorna um sucesso parcial.
                return res.status(201).json({ message: "Produto cadastrado, mas houve erro ao retornar os dados completos.", id: this.lastID });
            }
            if (!row) {
                 return res.status(404).json({ error: "Produto não encontrado após inserção."});
            }
            console.log(`Produto ${row.nome} (ID: ${row.id}) cadastrado por ${req.user?.username || 'usuário desconhecido'}`);
            res.status(201).json(row); // Retorna o objeto completo com os novos campos
        });
    });
});

// GET /api/produtos - Listar (Não precisa de alteração na query, SELECT * já pega tudo)
router.get('/', (req, res) => {
    const sql = "SELECT * FROM produtos ORDER BY id DESC"; // Ou ordene por nome, vencimento, etc.
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Erro ao listar produtos:", err.message);
            return res.status(500).json({ error: 'Erro interno ao buscar produtos.' });
        }
        res.status(200).json(rows);
    });
});

// DELETE /api/produtos/:id (Sem alterações necessárias para a funcionalidade pedida)
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM produtos WHERE id = ?";
    db.run(sql, id, function(err) {
        if (err) {
            console.error(`Erro ao excluir produto ${id}:`, err.message);
            return res.status(500).json({ error: 'Erro interno ao excluir produto.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }
        console.log(`Produto ${id} excluído por ${req.user?.username || 'usuário desconhecido'}`);
        res.status(204).send(); // No Content
    });
});

module.exports = router;