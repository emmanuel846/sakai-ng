# Déploiement dashboard (sakai-ng) sur Dokploy

## Prérequis

- VPS avec Dokploy installé
- Repo Git : `https://github.com/emmanuel846/sakai-ng.git`
- DNS : enregistrement A pour le domaine dashboard (ex. `dash.whotraveling.com`) → IP du VPS
- Backend API déjà déployé (ex. `https://live.whotraveling.com`)

## Option A — Application Dockerfile (recommandé)

1. Dokploy : **Create Project** → ex. `whotraveling-dashboard`
2. **Create Service** → type **Dockerfile** (ou Application)
3. Source Git : `emmanuel846/sakai-ng` + branche `master`
4. Dockerfile path : `Dockerfile`
5. Build argument (optionnel) :
   - `API_URL` = URL HTTPS de l’API (défaut `https://live.whotraveling.com`)
6. Onglet **Domains** :
   - Domaine : `dash.whotraveling.com` (ou celui choisi)
   - Port : `80`
   - Let’s Encrypt : activé
7. **Deploy**

## Option B — Docker Compose

1. **Create Service** → type **Docker Compose**
2. Chemin Compose : `docker-compose.dokploy.yml`
3. Environment Dokploy :
   ```
   API_URL=https://live.whotraveling.com
   ```
4. Domains : domaine → service / container `dashboard`, port `80`, Let’s Encrypt
5. **Deploy**

## Alignement backend

Sur le service API Dokploy, vérifier que le CORS autorise le domaine du dashboard  
(ex. `https://dash.whotraveling.com`).

## Vérifications

1. L’URL dashboard charge la page de login
2. Refresh sur une route profonde → pas d’erreur 404 nginx
3. Appels API vers `API_URL` (onglet Network)
4. Logs container : nginx démarre sans erreur

## Notes

- Sortie build servie : `dist/sakai-ng/browser`
- `environment.prod.ts` injecté au build via `fileReplacements` + `API_URL`
- Port Dokploy Domains : **80**
- Auto Deploy : activer le webhook Git dans Dokploy pour redéployer à chaque push
