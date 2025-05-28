// /frontend/src/utils/pdfGenerator.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Importar a função autoTable diretamente

export function gerarPdfComprovanteEnvio(envio) {
  if (!envio) {
    console.error("Dados do envio não fornecidos para gerar PDF.");
    return;
  }

  const doc = new jsPDF(); // Cria uma instância do jsPDF
  let yPos = 22; // Posição Y inicial
  const lineHeight = 7; // Altura da linha para texto simples
  const margin = 14;

  // Título
  doc.setFontSize(18);
  doc.text("Comprovante de Envio de Estoque", margin, yPos);
  yPos += lineHeight * 2;

  // Informações do Envio
  doc.setFontSize(11);
  doc.text(`ID da Transferência: ${envio.transferencia_id}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Data de Envio: ${envio.data_envio_formatada || 'N/A'}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Enviado Por (SME): ${envio.usuario_sme_nome || 'N/A'}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Escola de Destino: ${envio.nome_escola || 'N/A'}`, margin, yPos);
  yPos += lineHeight;

  // Status do Recebimento
  let statusText = "Status: Pendente de Recebimento";
  if (envio.data_recebimento_confirmado_formatada && envio.nome_usuario_confirmacao) {
    statusText = `Status: Recebido e confirmado por ${envio.nome_usuario_confirmacao.trim()}, em ${envio.data_recebimento_confirmado_formatada}`;
  } else if (envio.data_recebimento_confirmado_formatada) {
    statusText = `Status: Recebido em ${envio.data_recebimento_confirmado_formatada}`;
  }
  doc.text(statusText, margin, yPos);
  yPos += lineHeight * 1.5; // Mais espaço antes da tabela

  // Cabeçalho da Tabela de Itens
  doc.setFontSize(14);
  doc.text("Itens Enviados:", margin, yPos);
  yPos += lineHeight * 1.2;

  // Tabela de Itens
  const tableColumn = ["Produto", "Unidade", "Quantidade Enviada"];
  const tableRows = [];

  if (envio.itens && envio.itens.length > 0) {
    envio.itens.forEach(item => {
      const itemData = [
        item.nome_produto || 'Produto Desconhecido',
        item.unidade_medida || 'N/A',
        item.quantidade_enviada !== undefined ? item.quantidade_enviada : 'N/A',
      ];
      tableRows.push(itemData);
    });

    // ***** CORREÇÃO PRINCIPAL AQUI *****
    // Use a função autoTable importada, passando 'doc' como primeiro argumento
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yPos,
      theme: 'grid', // 'striped', 'grid', 'plain'
      headStyles: { fillColor: [22, 160, 133] }, // Cor para o cabeçalho
      // margin: { top: yPos } // startY já cuida disso para a tabela em si
    });
    // A posição Y após a tabela pode ser obtida de doc.lastAutoTable.finalY
    // yPos = doc.lastAutoTable.finalY + lineHeight * 2; // Se precisar adicionar mais conteúdo depois

  } else if (envio.error_itens) {
    doc.setFontSize(11);
    doc.setTextColor(255,0,0); // Cor vermelha para erro
    doc.text(`Erro ao carregar itens: ${envio.error_itens}`, margin, yPos);
    doc.setTextColor(0,0,0); // Resetar cor
    // yPos += lineHeight;
  } else {
    doc.setFontSize(11);
    doc.text("Nenhum item detalhado para este envio.", margin, yPos);
    // yPos += lineHeight;
  }

  // Rodapé (Opcional)
  // doc.setFontSize(9);
  // doc.text(`Gerado em: ${new Date().toLocaleString()}`, margin, doc.internal.pageSize.height - 10);
  
  // Nome do arquivo
  const escolaNomeSanitizado = (envio.nome_escola || 'escola_desconhecida').replace(/\s+/g, '_').toLowerCase();
  const fileName = `envio_${envio.transferencia_id}_${escolaNomeSanitizado}.pdf`;
  doc.save(fileName);
}