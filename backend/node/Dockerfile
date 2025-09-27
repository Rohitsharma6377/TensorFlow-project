# IND Chain Node Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV HTTP_PORT=4100
EXPOSE 4100
CMD ["node", "index.js"]
