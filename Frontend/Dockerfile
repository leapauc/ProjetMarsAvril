# Image Node
FROM node:20

WORKDIR /app

# Copier uniquement package.json d'abord (optimisation cache)
COPY package*.json ./

RUN npm install

# Copier uniquement les fichiers nécessaires
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]