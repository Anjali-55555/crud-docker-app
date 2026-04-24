FROM node:18

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/ .
COPY public/ ./public/

EXPOSE 8080

ENV PORT=8080

CMD ["node", "server.js"]