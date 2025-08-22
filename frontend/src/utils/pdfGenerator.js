// /frontend/src/utils/pdfGenerator.js

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- CONSTANTES DE ESTILO PARA FACILITAR A MANUTENÇÃO ---
const COLORS = {
  primary: '#2c3e50', // Azul escuro/Chumbo
  secondary: '#7f8c8d', // Cinza
  header: '#34495e',   // Azul mais escuro
  border: '#dddddd',   // Cinza MUITO claro para bordas da tabela
  tableHeaderBg: '#ecf0f1',
  status: {
    successBg: '#e8f5e9', successText: '#2e7d32',
    dangerBg: '#ffebee',  dangerText: '#c62828',
    warningBg: '#fffde7', warningText: '#f57f17',
    defaultBg: '#f5f5f5', defaultText: '#424242',
  },
};
const MARGIN = 15;

/**
 * Adiciona rodapé em todas as páginas.
 */
function addPageFooters(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.secondary);
    doc.line(MARGIN, doc.internal.pageSize.getHeight() - 12, pageWidth - MARGIN, doc.internal.pageSize.getHeight() - 12);
    const footerText = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
    doc.text(footerText, MARGIN, doc.internal.pageSize.getHeight() - 8);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - MARGIN, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
  }
}

/**
 * Desenha o cabeçalho principal do documento.
 * @returns {number} A posição Y final.
 */
function drawHeader(doc, envio) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.header);
  
  doc.setFontSize(22);
  doc.text('Comprovante de Envio', MARGIN, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.secondary);
  const idText = `Transferência ID: ${envio.transferencia_id}`;
  doc.text(idText, pageWidth - MARGIN, 18, { align: 'right' });
  const dateText = `Data de Envio: ${envio.data_envio_formatada || 'N/A'}`;
  doc.text(dateText, pageWidth - MARGIN, 23, { align: 'right' });
  
  doc.setDrawColor(COLORS.border);
  doc.line(MARGIN, 30, pageWidth - MARGIN, 30);
  
  return 38;
}

/**
 * Desenha a seção de informações com o status alinhado.
 * @returns {number} A posição Y final.
 */
function drawInfoSection(doc, envio, yPos) {
  const statusText = envio.status_geral || 'Pendente';
  
  const bodyData = [
    // Linha 1: Títulos
    [
      { content: 'DE (ORIGEM)', styles: { textColor: COLORS.secondary, fontSize: 10 } },
      { content: 'PARA (DESTINO)', styles: { textColor: COLORS.secondary, fontSize: 10 } }
    ],
    // Linha 2: Conteúdo Principal
    [
      { content: `Secretaria Municipal de Educação (SME)\nEnviado por: ${envio.usuario_sme_nome || 'N/A'}`, styles: { textColor: COLORS.primary, fontSize: 11, minCellHeight: 12 } },
      { content: `${envio.nome_escola || 'N/A'}`, styles: { textColor: COLORS.primary, fontSize: 11, verticalAlign: 'middle' } }
    ],
    // Linha 3: Status
    [
      { content: '' }, 
      { content: statusText }
    ]
  ];

  autoTable(doc, {
    startY: yPos,
    theme: 'plain',
    styles: { font: 'helvetica' },
    body: bodyData,
    didParseCell: function (data) {
      if (data.row.index === 2 && data.column.index === 1) {
        // <<< MUDANÇA PRINCIPAL AQUI >>>
        // Removemos o estilo de "pílula" (fundo, padding extra, etc.)
        // e deixamos apenas o texto colorido e em negrito.
        const status = data.cell.text[0].toLowerCase();
        let textColor = COLORS.status.defaultText;

        if (status.includes('totalmente confirmado') || status.includes('concluído')) {
            textColor = COLORS.status.successText;
        } else if (status.includes('totalmente devolvido')) {
            textColor = COLORS.status.dangerText;
        } else if (status.includes('parcialmente')) {
            textColor = COLORS.status.warningText;
        }

        data.cell.styles.textColor = textColor;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 10;
        data.cell.styles.cellPadding = { top: 1, left: 0, right: 0, bottom: 0 }; // Padding mínimo para alinhar
      }
    }
  });

  return doc.lastAutoTable.finalY + 8;
}

/**
 * Função principal para gerar o PDF.
 * @param {object} envio - O objeto contendo os dados do envio.
 */
export function gerarPdfComprovanteEnvio(envio) {
  if (!envio) {
    console.error("Dados do envio não fornecidos para gerar PDF.");
    return;
  }

  const doc = new jsPDF();
  let yPos = 0;

  yPos = drawHeader(doc, envio);
  yPos = drawInfoSection(doc, envio, yPos);

  const tableColumn = ["Produto (Unidade)", "Qtd.", "Status", "Data Processamento"];
  const tableRows = [];

  if (envio.itens && envio.itens.length > 0) {
    envio.itens.forEach(item => {
      let statusTexto = 'Pendente';
      if (item.status === 'confirmado') statusTexto = 'Confirmado';
      else if (item.status === 'devolvido') statusTexto = 'Devolvido';

      const dataProcessamentoTexto = (item.status !== 'pendente' && item.data_processamento) ? item.data_processamento : '';
      const nomeProdutoCompleto = `${item.nome_produto || 'Desconhecido'} (${item.unidade_medida || 'N/A'})`;
      
      tableRows.push([
        nomeProdutoCompleto,
        item.quantidade_enviada !== undefined ? item.quantidade_enviada : 'N/A',
        statusTexto,
        dataProcessamentoTexto,
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yPos,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 2.5,
        lineWidth: 0.1,
        lineColor: COLORS.border,
      },
      headStyles: {
        fillColor: COLORS.tableHeaderBg,
        textColor: COLORS.header,
        fontStyle: 'bold',
        fontSize: 9.5,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 32 },
        3: { cellWidth: 45 },
      },
      didParseCell: function (data) {
        if (data.column.index === 2 && data.cell.section === 'body') {
          const status = data.cell.raw; 
          if (status === 'Confirmado') {
            data.cell.styles.fillColor = COLORS.status.successBg;
            data.cell.styles.textColor = COLORS.status.successText;
          } else if (status === 'Devolvido') {
            data.cell.styles.fillColor = COLORS.status.dangerBg;
            data.cell.styles.textColor = COLORS.status.dangerText;
          } else if (status === 'Pendente') {
            data.cell.styles.fillColor = COLORS.status.warningBg;
            data.cell.styles.textColor = COLORS.status.warningText;
          }
        }
      }
    });

  } else {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.secondary);
    doc.text("Nenhum item detalhado para este envio.", MARGIN, yPos);
  }

  addPageFooters(doc);

  const escolaNomeSanitizado = (envio.nome_escola || 'escola_desconhecida').replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').toLowerCase();
  const fileName = `envio_${envio.transferencia_id}_${escolaNomeSanitizado}.pdf`;
  doc.save(fileName);
}