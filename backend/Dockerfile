# Estágio 1: Use uma imagem Node.js oficial. Alpine é uma versão leve.
FROM node:18-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia package.json e package-lock.json para o diretório de trabalho
# Isso aproveita o cache de camadas do Docker. Se esses arquivos não mudarem,
# o 'npm install' não será executado novamente em builds futuros.
COPY package*.json ./

# Instala as dependências de produção
RUN npm install --omit=dev

# Copia o restante dos arquivos da aplicação
COPY . .

# Expõe a porta que a aplicação Node.js vai rodar DENTRO do container.
# Vamos usar uma porta não convencional para evitar conflitos internos.
EXPOSE 5001

# Comando para iniciar a aplicação quando o container for executado
CMD [ "node", "server.js" ]