# Base alpine avec Node 18.20.7
FROM node:18.20.7-alpine

WORKDIR /app

# 🔧 Installer Chromium et ses dépendances
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  dumb-init

# Pour Puppeteer
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    CHROME_BIN=/usr/bin/chromium-browser \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copier package.json et package-lock.json
COPY package*.json ./

# Copier .husky avant npm ci
COPY .husky .husky

# Définir NODE_ENV à production
ENV NODE_ENV=production

# Installer les dépendances en mode production
RUN npm ci --omit=dev

# Copier tout le code
COPY . .

# Construire l’app NestJS
RUN npx -y @nestjs/cli@10.4.9 build

# Exposer le port standard de Nest
EXPOSE 3003

# Lancer l’app
CMD ["node", "dist/main.js"]
