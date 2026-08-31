# FILE: backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# El código sirve archivos subidos y PDFs desde backend/uploads
RUN mkdir -p uploads/pdfs logs

EXPOSE 5000

CMD ["node", "src/server.js"]
