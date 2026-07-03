# Global Clean Tech — Guide de déploiement (Render + Netlify)

Architecture : **backend + PostgreSQL sur Render**, **frontend sur Netlify** (qui proxifie `/api` vers Render — pas de souci de CORS).

> Déployez le **backend d'abord** : l'URL Render est nécessaire pour configurer Netlify.

---

## 1. Backend sur Render

### Option A — Avec un repo Git (recommandé)
1. Poussez le projet sur GitHub/GitLab.
2. Sur [render.com](https://render.com) → **New → Blueprint** → sélectionnez le repo.
   Le fichier `render.yaml` à la racine crée automatiquement le service web + la base PostgreSQL.
3. Renseignez les variables marquées `sync: false` quand Render les demande :
   - `FRONTEND_URL` → l'URL Netlify (vous pourrez la mettre à jour après l'étape 2)
   - `MAIL_HOST` / `MAIL_PORT` / `MAIL_USER` / `MAIL_PASS` → vos identifiants SMTP (laissez vide pour la démo : les emails échouent silencieusement sans bloquer le site)

### Option B — Manuellement
1. **New → PostgreSQL** (plan Free) → notez l'**Internal Database URL**.
2. **New → Web Service** :
   - Root Directory : `backend`
   - Build Command : `npm install && npm run build`
   - Start Command : `npm run start:prod` (applique les migrations puis démarre)
   - Health Check Path : `/api/health`
3. Variables d'environnement :

   | Variable | Valeur |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | l'Internal Database URL de l'étape 1 |
   | `JWT_SECRET` | une chaîne aléatoire longue (32+ caractères) |
   | `JWT_EXPIRES_IN` | `8h` |
   | `FRONTEND_URL` | l'URL Netlify (ex: `https://globalcleantech.netlify.app`) |
   | `MAIL_*` | vos identifiants SMTP (optionnel pour la démo) |

### Créer le compte admin (seed)
Le shell Render n'est pas disponible en plan Free. Lancez le seed **depuis votre machine** contre la base distante :

```bash
cd backend
# Récupérez l'External Database URL dans Render → base → Connect
set DATABASE_URL=postgresql://...render.com/globalcleantech_xxx
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

Admin par défaut : `admin@globalcleantech.sn` / `Admin@GCT2024!` — **changez ce mot de passe dès la première connexion** (page Mon profil).

---

## 2. Frontend sur Netlify

1. **Avant de builder**, éditez [frontend/public/_redirects](frontend/public/_redirects) : remplacez `https://VOTRE-BACKEND.onrender.com` par l'URL réelle de votre service Render.
2. Vérifiez [frontend/.env.production](frontend/.env.production) : mettez le **vrai numéro WhatsApp** (`VITE_WHATSAPP_NUMBER`) et les vraies URLs des réseaux sociaux.

### Option A — Avec un repo Git (recommandé)
Sur [netlify.com](https://netlify.com) → **Add new site → Import an existing project** :
- Base directory : `frontend`
- Build command : `npm run build`
- Publish directory : `frontend/dist`

### Option B — Drag & drop
```bash
cd frontend
npm run build
```
Puis glissez le dossier `frontend/dist` sur Netlify (Deploys → drag & drop).

3. Une fois le site créé, copiez son URL et **mettez à jour `FRONTEND_URL` sur Render** (sinon les requêtes seront bloquées par le CORS), puis redéployez le backend.

---

## 3. Vérifications avant la présentation client

- [ ] `https://VOTRE-BACKEND.onrender.com/api/health` répond `{"status":"ok"}`
- [ ] Le site Netlify s'affiche, la page d'accueil charge les services/témoignages (= l'API répond à travers le proxy)
- [ ] Connexion admin OK, **mot de passe changé**, photo de profil ajoutée
- [ ] Formulaire de candidature testé de bout en bout avec fichiers
- [ ] Numéro WhatsApp réel dans `.env.production` (bouton flottant + footer + actions admin)
- [ ] Supprimez les données de test depuis le dashboard (candidatures/demandes d'essai)

## ⚠️ Limites du plan gratuit à connaître

1. **Mise en veille** : le backend Render Free s'endort après 15 min d'inactivité — la première requête prend 30 à 60 s.
   **Avant la démo, ouvrez le site 2-3 minutes à l'avance** pour réveiller le serveur.
2. **Fichiers uploadés éphémères** : sur Render Free, le disque est réinitialisé à chaque redéploiement/redémarrage — les CV, photos et CNI uploadés en production **seront perdus**. Les données en base (candidatures, textes) sont conservées.
   Pour la production réelle : ajoutez un disque persistant Render (payant, pointez `UPLOAD_DIR` dessus) ou un stockage externe (Cloudinary/S3).
3. **Base PostgreSQL Free** : expire après 30 jours sur Render (sauvegardez ou passez au plan payant pour le client).
4. **Emails** : sans `MAIL_USER`/`MAIL_PASS`, les notifications (nouvelle candidature, changement de statut) ne partent pas — le site fonctionne quand même.
