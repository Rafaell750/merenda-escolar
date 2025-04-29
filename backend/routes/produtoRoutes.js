// backend/routes/produtoRoutes.js
const express = require('express');
const db = require('../database/dbConnection');
const { authenticateToken } = require('../middleware/authMiddleware'); // Certifique-se que o caminho está correto
const router = express.Router();

// POST /api/produtos - Cadastrar (Seu código existente)
router.post('/', authenticateToken, (req, res) => { // Adicionado authenticateToken aqui também
    const { nome, descricao, unidade_medida, categoria, quantidade, valor, data_vencimento } = req.body; // Use unidade_medida vindo do frontend

    // Validação (Adapte conforme sua necessidade)
    if (!nome || !unidade_medida || !categoria) {
        return res.status(400).json({ error: 'Nome, Unidade de Medida e Categoria são obrigatórios.' });
    }
    if (quantidade !== undefined && quantidade !== null && (isNaN(parseFloat(quantidade)) || parseFloat(quantidade) < 0)) {
        return res.status(400).json({ error: 'Quantidade inválida. Deve ser um número não negativo.' });
    }
    if (valor !== undefined && valor !== null && (isNaN(parseFloat(valor)) || parseFloat(valor) < 0)) {
        return res.status(400).json({ error: 'Valor inválido. Deve ser um número não negativo.' });
    }
    // Você pode adicionar validação para data_vencimento (formato YYYY-MM-DD) se desejar

    // ***** NOVO: Pega a data/hora atual no formato ISO *****
    const dataModificacaoAtual = new Date().toISOString();

    const insertSql = `
        INSERT INTO produtos (nome, descricao, unidade_medida, categoria, quantidade, valor, data_vencimento, data_modificacao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Use os nomes corretos dos campos (unidade_medida)
    db.run(insertSql, [
        nome,
        descricao,
        unidade_medida, // Garanta que o frontend envie unidade_medida
        categoria,
        // Trate valores nulos/vazios que vêm do frontend como NULL no banco
        (quantidade === '' || quantidade === undefined) ? null : parseFloat(quantidade),
        (valor === '' || valor === undefined) ? null : parseFloat(valor),
        (data_vencimento === '' || data_vencimento === undefined) ? null : data_vencimento,
        dataModificacaoAtual
    ], function (err) {
        if (err) {
            console.error(`Erro ao cadastrar produto ${nome}:`, err.message);
             if (err.message.includes('NOT NULL constraint failed')) {
                 return res.status(400).json({ error: 'Erro de dados: Verifique os campos obrigatórios.' });
             }
             if (err.message.includes('UNIQUE constraint failed')) { // Exemplo: se nome for UNIQUE
                  return res.status(409).json({ error: 'Erro: Já existe um produto com este nome.' }); // 409 Conflict
             }
            return res.status(500).json({ error: 'Erro interno ao cadastrar produto.' });
        }
        // Busca o produto recém-inserido para retornar o objeto completo
        db.get("SELECT * FROM produtos WHERE id = ?", [this.lastID], (selectErr, row) => {
            if (selectErr || !row) {
                console.error("Erro ao buscar produto recém-cadastrado ou não encontrado:", selectErr?.message);
                 // Mesmo com erro aqui, o produto foi inserido. Retorna um sucesso parcial.
                 return res.status(201).json({
                    message: "Produto cadastrado, mas houve erro ao retornar os dados completos.",
                    id: this.lastID,
                    // Retorna os dados enviados caso não consiga buscar
                    nome: nome,
                    categoria: categoria,
                    unidade_medida: unidade_medida
                    // ... outros campos se necessário
                 });
            }
            console.log(`Produto ${row.nome} (ID: ${row.id}) cadastrado por ${req.user?.username || 'usuário'}`);
            res.status(201).json(row); // Retorna o objeto completo
        });
    });
});

// GET /api/produtos - Listar (Seu código existente)
router.get('/', authenticateToken, (req, res) => { // Protegido também
    const sql = "SELECT * FROM produtos ORDER BY data_modificacao DESC"; // Ou ordene por nome, etc.
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Erro ao listar produtos:", err.message);
            return res.status(500).json({ error: 'Erro interno ao buscar produtos.' });
        }
        res.status(200).json(rows);
    });
});

// --- **** NOVA ROTA PUT PARA ATUALIZAR **** ---
router.put('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    // Pegue os dados do corpo da requisição
    const { nome, descricao, unidade_medida, categoria, quantidade, valor, data_vencimento } = req.body;

    // Validação (similar ao POST, adapte conforme necessário)
    if (!nome || !unidade_medida || !categoria) {
        return res.status(400).json({ error: 'Nome, Unidade de Medida e Categoria são obrigatórios.' });
    }
    if (quantidade !== undefined && quantidade !== null && (isNaN(parseFloat(quantidade)) || parseFloat(quantidade) < 0)) {
        return res.status(400).json({ error: 'Quantidade inválida. Deve ser um número não negativo.' });
    }
    if (valor !== undefined && valor !== null && (isNaN(parseFloat(valor)) || parseFloat(valor) < 0)) {
        return res.status(400).json({ error: 'Valor inválido. Deve ser um número não negativo.' });
    }

    // ***** NOVO: Pega a data/hora atual para atualização *****
    const dataModificacaoAtual = new Date().toISOString();

    const updateSql = `
        UPDATE produtos
        SET nome = ?,
            descricao = ?,
            unidade_medida = ?,
            categoria = ?,
            quantidade = ?,
            valor = ?,
            data_vencimento = ?,
            data_modificacao = ?
        WHERE id = ?
    `;

    db.run(updateSql, [
        nome,
        descricao,
        unidade_medida, // Use o nome correto do campo
        categoria,
        // Trate valores nulos/vazios que vêm do frontend como NULL no banco
        (quantidade === '' || quantidade === undefined) ? null : parseFloat(quantidade),
        (valor === '' || valor === undefined) ? null : parseFloat(valor),
        (data_vencimento === '' || data_vencimento === undefined) ? null : data_vencimento,
        dataModificacaoAtual,
        id // ID do produto a ser atualizado
    ], function (err) {
        if (err) {
            console.error(`Erro ao atualizar produto ${id}:`, err.message);
            // Adicione verificação para UNIQUE constraint se aplicável
             if (err.message.includes('UNIQUE constraint failed')) {
                  return res.status(409).json({ error: 'Erro: Já existe outro produto com este nome.' });
             }
            return res.status(500).json({ error: 'Erro interno ao atualizar produto.' });
        }
        // Verifica se alguma linha foi realmente alterada
        if (this.changes === 0) {
            // Isso pode acontecer se o ID não existir ou se os dados enviados forem idênticos aos existentes
            // Vamos verificar se o produto existe para dar uma mensagem melhor
             db.get("SELECT id FROM produtos WHERE id = ?", [id], (findErr, row) => {
                if (!row) {
                     return res.status(404).json({ error: 'Produto não encontrado para atualização.' });
                } else {
                    // O produto existe, mas nada mudou (ou houve um erro silencioso)
                    // Podemos retornar 200 OK com os dados originais ou uma mensagem específica
                    // Por segurança, vamos buscar e retornar o estado atual
                    db.get("SELECT * FROM produtos WHERE id = ?", [id], (getErr, updatedRow) => {
                         if (getErr || !updatedRow) {
                             return res.status(500).json({ error: 'Erro ao buscar dados após atualização (sem alterações).' });
                         }
                         console.log(`Produto ${id} solicitado para atualização, mas nenhum dado foi alterado.`);
                         res.status(200).json(updatedRow); // Retorna o produto como está no banco
                     });
                }
             });
        } else {
             // Busca o produto atualizado para retornar ao frontend
             db.get("SELECT * FROM produtos WHERE id = ?", [id], (selectErr, row) => {
                 if (selectErr || !row) {
                     console.error("Erro ao buscar produto após atualização bem-sucedida:", selectErr?.message);
                     // Mesmo assim, a atualização ocorreu. Retornar um sucesso parcial.
                     return res.status(200).json({ message: "Produto atualizado, mas erro ao retornar dados completos.", id: id });
                 }
                 console.log(`Produto ${row.nome} (ID: ${id}) atualizado por ${req.user?.username || 'usuário'}`);
                 res.status(200).json(row); // Retorna o objeto atualizado
             });
        }
    });
});


// DELETE /api/produtos/:id (Seu código existente)
router.delete('/:id', authenticateToken, (req, res) => { // Protegido também
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
        console.log(`Produto ${id} excluído por ${req.user?.username || 'usuário'}`);
        res.status(204).send(); // No Content
    });
});

module.exports = router;