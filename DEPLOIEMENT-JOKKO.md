# Global Clean Tech — Déploiement sur VPS Jokko (Docker, frontend+backend en un seul conteneur)

Architecture : **un conteneur Docker unique** exécute le backend Express, qui sert
aussi les fichiers statiques du frontend buildé (même origine, pas de CORS).
**PostgreSQL tourne dans un second conteneur** à côté (données séparées de
l'appli, pour ne rien perdre lors des mises à jour). Un **Nginx installé
directement sur la VPS** (hors Docker) gère le nom de domaine et le SSL
(Let's Encrypt), et redirige vers le conteneur applicatif.

> ⚠️ Les offres "Hébergement web" mutualisées (cPanel, packs Basic/Start
> Up/Pro) de Jokko ne conviennent PAS : elles ne font tourner que du
> PHP/WordPress, pas Docker ni Node.js. Il faut une offre **Serveur cloud
> (VPS)** — le **VPS-Basic (3000 FCFA/mois — 2 vCore, 2 Go RAM, 64 Go SSD)**
> suffit largement pour cette application.

---

## 1. Commander le VPS

1. Sur [jokko.sn/vps](https://jokko.sn/vps/) → **VPS-Basic** → Commander.
2. Au moment de la configuration, choisissez une distribution **Ubuntu 22.04 LTS**
   (ou 24.04 si proposée) — pas Windows, pas de panneau cPanel/Plesk nécessaire.
3. Une fois la commande validée, Jokko envoie par email : l'**adresse IP** du
   serveur, l'utilisateur (`root` en général) et le mot de passe (ou une clé SSH).

---

## 2. Connexion et préparation du serveur

Depuis votre machine (PowerShell, ou un terminal SSH) :

```bash
ssh root@VOTRE_IP_VPS
```

Puis sur le serveur :

```bash
apt update && apt upgrade -y

# Docker + docker compose
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# Nginx (reverse proxy hôte) + Certbot (SSL gratuit)
apt install -y nginx certbot python3-certbot-nginx

# Pare-feu de base
apt install -y ufw
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

---

## 3. Récupérer le projet sur le serveur

**Option A — avec un dépôt Git (recommandé)** :

```bash
cd /opt
git clone <url-de-votre-repo> globalcleantech
cd globalcleantech
```

**Option B — sans Git, en envoyant les fichiers depuis votre machine** :

```bash
# Depuis votre PC (pas sur le serveur), dans le dossier du projet :
scp -r . root@VOTRE_IP_VPS:/opt/globalcleantech
```

---

## 4. Configurer les variables d'environnement

Sur le serveur, dans `/opt/globalcleantech` :

```bash
cp .env.docker.example .env
nano .env
```

Remplissez au minimum :
- `POSTGRES_PASSWORD` et la ligne `DATABASE_URL` correspondante (mot de passe fort, les deux doivent correspondre)
- `JWT_SECRET` (chaîne aléatoire longue — ex: `openssl rand -hex 32`)
- `MAIL_PASS` (mot de passe de la boîte contact@globalcleantechsn.com chez LWS)
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (générez-les avec `npx web-push generate-vapid-keys` depuis n'importe quelle machine avec Node)
- `GOOGLE_CLIENT_ID` (celui déjà créé dans Google Cloud Console — pensez à ajouter `https://globalcleantechsn.com` dans ses origines JavaScript autorisées)

`FRONTEND_URL` est déjà pré-rempli à `https://globalcleantechsn.com`.

---

## 5. Construire et démarrer les conteneurs

```bash
cd /opt/globalcleantech
docker compose build
docker compose up -d
```

Vérifiez que tout tourne :

```bash
docker compose ps
docker compose logs -f app
```

Vous devriez voir `🚀 Serveur Global Clean Tech démarré...` et
`🖥️  Frontend servi depuis /app/public`. Les migrations Prisma s'appliquent
automatiquement au démarrage du conteneur `app`.

### Créer le compte administrateur

```bash
docker compose exec app npx tsx prisma/seed.ts
```

Admin par défaut créé par le seed : `admin@globalcleantech.sn` / `Admin@GCT2024!`
— **changez ce mot de passe dès la première connexion** (page Mon profil du
dashboard).

À ce stade, l'appli répond déjà en HTTP sur `http://VOTRE_IP_VPS:3001`... mais
ce port n'est volontairement exposé qu'en local (`127.0.0.1:3001` dans
`docker-compose.yml`) — le seul accès public passera par Nginx, configuré à
l'étape suivante.

---

## 6. Pointer le domaine vers le VPS (DNS chez LWS)

Le domaine `globalcleantechsn.com` est géré chez **LWS**, pas chez Jokko. Il
faut donc modifier sa zone DNS là-bas (pas à faire chez Jokko) :

1. Connectez-vous sur le panel LWS → gestion du domaine `globalcleantechsn.com` → Zone DNS.
2. Modifiez (ou créez) les enregistrements **A** :
   - `@` (ou vide) → IP du VPS Jokko
   - `www` → IP du VPS Jokko
3. Attendez la propagation (de quelques minutes à quelques heures).

Vous pouvez vérifier la propagation avec `nslookup globalcleantechsn.com`
depuis votre machine.

> ⚠️ Ce changement DNS déplace le site vers le VPS Jokko. Le SMTP mail
> (`mail.globalcleantechsn.com`, géré via les enregistrements MX chez LWS)
> n'est pas affecté — seuls les enregistrements A du domaine racine/www changent.

---

## 7. Activer Nginx + SSL

Une fois le DNS propagé, sur le serveur :

```bash
cp /opt/globalcleantech/nginx/globalcleantechsn.com.conf /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/globalcleantechsn.com.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Certificat SSL gratuit (renouvellement automatique déjà configuré par certbot)
certbot --nginx -d globalcleantechsn.com -d www.globalcleantechsn.com
```

Le site est maintenant accessible en HTTPS sur `https://globalcleantechsn.com`.

---

## 8. Vérifications avant de considérer le déploiement terminé

- [ ] `https://globalcleantechsn.com/api/health` répond `{"status":"ok"}`
- [ ] Le site s'affiche, la page d'accueil charge les services/témoignages
- [ ] Connexion admin OK, mot de passe changé, photo de profil ajoutée
- [ ] Connexion "Se connecter avec Google" fonctionne (origine ajoutée dans Google Cloud Console)
- [ ] Formulaire de candidature testé de bout en bout avec fichiers (upload persistant : re-testez après un `docker compose restart app`)
- [ ] Un email de test part bien (SMTP configuré) et affiche le logo correctement
- [ ] Cloche de notifications + push navigateur fonctionnent (si clés VAPID renseignées)
- [ ] Numéro WhatsApp réel dans `frontend/.env.production`

---

## 9. Mises à jour futures

Après une modification du code (localement, puis poussée sur le serveur) :

```bash
cd /opt/globalcleantech
git pull   # ou re-upload via scp si pas de Git
docker compose build
docker compose up -d
```

Les données (PostgreSQL + fichiers uploadés) sont dans des volumes Docker
nommés (`db_data`, `uploads_data`) : elles survivent à un rebuild/redémarrage
des conteneurs. Elles ne seraient perdues qu'en supprimant explicitement ces
volumes (`docker compose down -v` — à éviter).

## 10. Sauvegardes (important, à faire régulièrement)

```bash
# Sauvegarde de la base
docker compose exec db pg_dump -U gct globalcleantech > backup-$(date +%F).sql

# Sauvegarde des fichiers uploadés
docker run --rm -v globalcleantech_uploads_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

Copiez ensuite ces fichiers hors du serveur (vers votre machine, un autre
stockage, etc.) — un VPS seul n'est pas une sauvegarde.
