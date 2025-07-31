# --- Estágio 1: Build ---
# Usa a imagem do Node para construir o projeto Vue
FROM node:18-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência e instala
COPY package*.json ./
RUN npm install

# Copia o código-fonte do frontend
COPY . .

# Argumento que receberá a URL da API do docker-compose.yml
ARG VITE_API_BASE_URL
# Define a variável de ambiente para o comando de build do Vite
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Executa o build de produção, usando o modo 'docker' que criaremos
# Este comando gera a pasta /app/dist com os arquivos estáticos
RUN npm run build:docker

# --- Estágio 2: Serve ---
# Usa uma imagem Nginx leve para servir os arquivos estáticos
FROM nginx:stable-alpine

# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia nossa configuração personalizada do Nginx para o container
COPY nginx.conf /etc/nginx/conf.d/

# Copia os arquivos estáticos construídos no Estágio 1 para a pasta que o Nginx serve
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe a porta 80 (padrão do Nginx) dentro do container.
# Mapearemos para uma porta diferente no host no docker-compose.yml
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]