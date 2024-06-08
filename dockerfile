FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install -g pnpm

RUN pnpm install

COPY . .

EXPOSE 1234

ENV PORT=1234

CMD ["sh", "-c", "node ./node_modules/y-webrtc/bin/server.js"]
