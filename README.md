# Consulat Congo-Bénin — Frontend

Application web du **Consulat Honoraire de la République du Congo au Bénin** : site public, **espace consulaire** des ressortissants (inscription, demandes de carte consulaire / laissez-passer, suivi de dossier) et **espace d'administration** pour les agents. Consomme l'API [consulat.api](https://github.com/GuivenM/consulat.api).

> Le projet est né d'un clone du site de l'AJDCB, lui-même issu d'une maquette Figma.

## Stack

- **React 18** + **TypeScript**, bundlé avec **Vite**
- **React Router 7**
- **Tailwind CSS 4**, composants **shadcn/ui** (Radix) dans `src/app/components/ui`
- **sonner** pour les notifications, **lucide-react** pour les icônes

## Démarrage

```bash
npm install
cp .env.example .env    # puis adapter VITE_API_URL
npm run dev             # http://localhost:5173
npm run build           # bundle de production dans dist/
```

Le backend doit tourner en parallèle (voir le README de `consulat.api`) et autoriser l'origine du frontend dans `CORS_ALLOWED_ORIGINS`.

| Variable | Rôle |
|---|---|
| `VITE_API_URL` | URL de base de l'API, **avec** `/api` (défaut : `http://localhost:8000/api`). Lue **à la compilation** : il faut relancer `npm run build` après l'avoir changée. |

## Les trois espaces

| Espace | URL | Public | Auth |
|---|---|---|---|
| Site public | `/`, `/services`, `/guide`, `/news`, `/contact`… | Tout le monde | — |
| Espace consulaire | `/espace-consulaire/...` | Ressortissants | Compte ressortissant (inscription + vérification d'email) |
| Administration | `/admin/...` | Agents, admins, super admin | Compte créé par un super admin, activé par email |

### Administration

Menu et accès selon le rôle (voir le README de l'API pour le détail des rôles) :

- **Demandes** — liste et détail des dossiers, vérification des pièces (valider / rejeter avec motif), encaissement au guichet, passage aux statuts « en traitement », « prêt », « retiré », ou rejet.
- **Registre consulaire**, **Carte** — ressortissants inscrits et leur répartition.
- **Messages** — formulaire de contact public, avec réponse par email.
- **Actualités**, **Guide**, **Partenaires** — contenu du site.
- **Configuration** — tarifs et pièces requises.
- **Utilisateurs** et **Journal** — réservés au `super_admin`.

## Organisation du code

```
src/
├── main.tsx
├── lib/
│   ├── api.ts               # client de l'espace admin (token, ApiError, téléchargement de fichiers)
│   ├── ressortissantApi.ts  # client de l'espace consulaire
│   └── compressImage.ts     # compression des images avant envoi
└── app/
    ├── App.tsx              # toutes les routes
    ├── pages/               # site public
    ├── ressortissant/       # espace consulaire (Dashboard, NouvelleDemande, DemandeDetail…)
    ├── admin/               # espace admin (layout, pages/, hooks/, types.ts)
    ├── context/             # AuthContext (admin) et contexte ressortissant
    └── components/          # composants communs + ui/ (shadcn)
```

**Deux clients d'API, deux sessions.** L'admin et le ressortissant ont chacun leur token en `localStorage` (`consulat_admin_token` pour l'admin) et leur client. Ne pas les mélanger : les routes `/v1/admin/*` refusent un token de ressortissant, et inversement.

**Fichiers privés.** Les pièces des dossiers ne sont pas accessibles par URL directe : elles sont récupérées avec le token (`fetchFileUrl` / `openFile` dans `lib/api.ts`), puis affichées ou ouvertes depuis une URL `blob:`.

## Déploiement

`npm run build` produit un site statique dans `dist/`, à servir avec une réécriture vers `index.html` pour toutes les routes (application à page unique). Sur Apache, par exemple :

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

Vérifier avant la mise en ligne que `VITE_API_URL` pointe sur l'API de production et que son `CORS_ALLOWED_ORIGINS` contient le domaine du site.

## Points d'attention

- **`FedaPayButton`** (`src/app/components/`) n'est utilisé nulle part : reliquat de l'AJDCB, en attente du paiement en ligne des demandes (non disponible côté API pour l'instant).
- **Pas de tests** automatisés côté frontend.
- Les types TypeScript de l'API sont écrits à la main (`admin/types.ts`, `ressortissant/types.ts`) : les tenir à jour quand une réponse de l'API change.
