# ── Global Clean Tech — image unique frontend + backend ──────────────────────
# Un seul processus Node sert l'API (/api/*) ET les fichiers statiques du
# frontend buildé (voir backend/src/app.ts). PostgreSQL reste dans un
# conteneur séparé (voir docker-compose.yml) — ne pas le fusionner ici.
#
# Build (depuis la racine du repo) :
#   docker build -t globalcleantech-app .
# Normalement lancé via docker-compose (cf. docker-compose.yml).

# ── Étape 1 : build du frontend (Vite/React) ──────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Les variables VITE_* utilisées au build doivent être passées en --build-arg
# si elles diffèrent de frontend/.env.production (déjà versionné et utilisé par défaut).
RUN npm run build

# ── Étape 2 : build du backend (TypeScript + Prisma) ──────────────────────────
FROM node:20-alpine AS backend-build
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# ── Étape 3 : image finale (runtime) ─────────────────────────────────────────
FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production

# node_modules complet (inclut le client Prisma généré + le CLI prisma,
# nécessaire pour lancer les migrations au démarrage du conteneur)
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package*.json ./
COPY --from=backend-build /app/backend/prisma ./prisma
COPY --from=backend-build /app/backend/dist ./dist

# Frontend buildé — servi statiquement par Express (voir app.ts, PUBLIC_DIR)
COPY --from=frontend-build /app/frontend/dist ./public

# Dossier des fichiers uploadés (CV, photos, CNI...) — à monter en volume
# dans docker-compose.yml pour ne pas perdre les fichiers à chaque redéploiement.
RUN mkdir -p uploads

EXPOSE 3001

# Applique les migrations Prisma en attente puis démarre le serveur.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]
