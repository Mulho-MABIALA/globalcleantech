# Global Clean Tech — Guide de démarrage

## Prérequis
- Node.js 18+
- PostgreSQL 14+ (local ou cloud)
- npm ou pnpm

---

## 1. Backend

```bash
cd globalcleantech/backend
npm install

# Configurer la base de données dans .env
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/globalcleantech"

# Créer les tables
npx prisma migrate dev --name init

# Générer le client Prisma
npx prisma generate

# Créer le premier admin (email: admin@globalcleantech.sn / mdp: Admin@GCT2024!)
npx tsx prisma/seed.ts

# Démarrer le serveur (port 3001)
npm run dev
```

## 2. Frontend

```bash
cd globalcleantech/frontend
npm install

# Adapter VITE_WHATSAPP_NUMBER dans .env

# Démarrer le client (port 5173)
npm run dev
```

## 3. Accès

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Site public |
| http://localhost:5173/admin/login | Dashboard admin |
| http://localhost:3001/api/health | Santé de l'API |

## Identifiants admin par défaut
- Email : `admin@globalcleantech.sn`
- Mot de passe : `Admin@GCT2024!`

> **Changer le mot de passe après la première connexion.**

## Variables à configurer

### Backend `.env`
- `DATABASE_URL` — URL PostgreSQL
- `JWT_SECRET` — chaîne aléatoire longue (min 32 chars)
- `MAIL_HOST/PORT/USER/PASS` — SMTP (Mailtrap en dev)

### Frontend `.env`
- `VITE_WHATSAPP_NUMBER` — ex: `221771234567`
- `VITE_FACEBOOK_URL`, `VITE_INSTAGRAM_URL`, `VITE_INFO_SITE_URL`
