# Mandat de recherche d'intermédiation

POC stateless de signature électronique construit avec Next.js App Router. La page
racine (`/`) contient le formulaire administrateur ; les liens générés utilisent le
paramètre `?data=` pour ouvrir le formulaire client.

## Déploiement Vercel

1. Importez le dépôt dans Vercel et sélectionnez la **branche qui contient ce
   commit** comme branche de production.
2. Dans **Settings → General → Root Directory**, laissez le champ vide (ou utilisez
   `.`). Le fichier `package.json` est à la racine de ce dépôt.
3. Conservez les commandes détectées : `npm ci` pour l'installation et `npm run
   build` pour la compilation. Elles sont également explicitées dans `vercel.json`.
4. Déployez puis ouvrez `https://<votre-projet>.vercel.app/`. Il ne faut pas ajouter
   de sous-chemin à cette URL : l'écran administrateur est servi par `app/page.tsx`.

Si Vercel renvoie une page **404**, vérifiez dans le détail du déploiement que le
commit de production est bien celui qui contient `app/page.tsx` et que le *Root
Directory* n'est pas configuré vers un sous-dossier inexistant. Une réponse **401**
ou une page *Authentication Required* indique à la place que la Deployment Protection
Vercel est activée : désactivez-la ou autorisez les visiteurs concernés dans **Settings
→ Deployment Protection**.

## Développement local

```bash
npm ci
npm run dev
```
