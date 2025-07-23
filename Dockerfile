# Base alpine avec Node 18.20.7
FROM node:18.20.7-alpine

WORKDIR /app

# Installer outils pour build natif (si besoin, sinon tu peux retirer)
#RUN apk add --no-cache python3 make g++

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer la bonne version de npm (en cas de mismatch)
#RUN npm install -g npm@10.8.2

# Copier .husky avant npm ci
COPY .husky .husky

# Installer les dépendances en mode production
RUN npm ci --omit=dev

# Copier tout le code
COPY . .

# Construire l’app NestJS
RUN npx -y @nestjs/cli@10.4.9 build

# Supprimer les outils de build pour alléger
#RUN apk del python3 make g++

# Exposer le port standard de Nest (ajuste si besoin)
EXPOSE 3003

# Lancer l’app
CMD ["node", "dist/main.js"]
