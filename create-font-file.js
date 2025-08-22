// create-font-file.js
const fs = require('fs');
const path = require('path');
const https = require('https');

// Define os caminhos onde o arquivo da fonte será salvo
const fontsDir = path.join(__dirname, 'src', 'utils', 'fonts');
const outputFilePath = path.join(fontsDir, 'Roboto-Normal.js');

// URL direta para o arquivo da fonte Roboto .ttf
const fontUrl = 'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto-Regular.ttf';

console.log('Iniciando o processo para criar o arquivo da fonte...');

// 1. Garante que o diretório /src/utils/fonts exista
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
  console.log(`-> Pasta criada em: ${fontsDir}`);
}

// 2. Baixa o arquivo da fonte
console.log(`-> Baixando a fonte de ${fontUrl}`);
https.get(fontUrl, (response) => {
  const data = [];
  response.on('data', (chunk) => data.push(chunk));
  
  response.on('end', () => {
    // 3. Converte o arquivo para Base64
    const buffer = Buffer.concat(data);
    const base64Font = buffer.toString('base64');
    console.log('-> Fonte baixada e convertida com sucesso.');

    // 4. Cria o conteúdo do arquivo .js
    const fileContent = `// /frontend/src/utils/fonts/Roboto-Normal.js\n// Este arquivo foi gerado automaticamente.\n\nexport const robotoNormal = '${base64Font}';\n`;

    // 5. Salva o arquivo final
    fs.writeFileSync(outputFilePath, fileContent);
    console.log('\n✅ SUCESSO!');
    console.log(`O arquivo da fonte foi salvo em: ${outputFilePath}`);
    console.log('\nAgora o seu pdfGenerator.js irá funcionar corretamente.');
  });

}).on('error', (err) => {
  console.error('❌ ERRO ao baixar a fonte:', err.message);
});