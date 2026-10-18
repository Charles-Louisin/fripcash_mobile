# FripCash mobile

Application Expo (SDK 57) pour le marketplace FripCash. Elle parle au backend Express existant (`fripcash/backend`), préfixe `/api/v1`.

## EXPO_PUBLIC_API_URL — quel lien, où le mettre

C’est **l’URL de l’API FripCash**, pas l’URL du tunnel Expo.

Le tunnel (`npx expo start --tunnel`) sert uniquement le JavaScript de l’app (Metro). Le téléphone appelle ensuite le backend **directement**.

| Situation | Valeur |
| --- | --- |
| Téléphone et PC sur le même Wi-Fi | `http://<IP-LAN-du-PC>:5000/api/v1` |
| Backend déjà en ligne | `https://ton-domaine.com/api/v1` |

Exemple Wi-Fi local : `http://192.168.1.24:5000/api/v1`

**Fichier :** `fripCash_mobile/.env` (copie `.env.example`). Ce fichier n’est pas commité.

```env
EXPO_PUBLIC_API_URL=http://10.221.156.115:5000/api/v1
```

Puis redémarre Metro : `npx expo start --tunnel --clear`. Sur le téléphone, recharge l’app (pas seulement un Fast Refresh).

Ce n’est **pas** une URL `exp.direct` / `expo.dev` / ngrok.

## Démarrer avec le tunnel

Le backend doit écouter `0.0.0.0:5000` (déjà le cas) et le téléphone doit joindre `EXPO_PUBLIC_API_URL`.

```bash
cd fripCash_mobile
npm install
npx expo install @expo/ngrok
npx expo start --tunnel --clear
```

Ouvre le QR code dans Expo Go. Le JS arrive par le tunnel ; les appels API passent par `EXPO_PUBLIC_API_URL`.

## Charge (k6)

Le backend plafonne `GET /listings` (défaut 40, max 80), augmente le pool Mongo, et limite le JSON à 1 Mo (16 Mo uniquement pour `/media`).

Pour un test de charge, vise `/api/v1/health` et `/api/v1/listings?limit=40`. Si le plafond te gêne :

```env
RATE_LIMIT_MAX=0
```

dans `fripcash/backend/.env` (0 = pas de plafond global ; l’auth reste limitée).


"runtimeVersion": {
      "policy": "appVersion"
    }