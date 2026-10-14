# LoyalCart – Deployment & Setup

## Local Dev
```bash
npm run dev       # start Vite dev server
npm run build     # tsc + vite build
npm run lint      # ESLint check
```

## Deploy
```bash
vercel --prod     # or push to GitHub with Vercel connected
```

## Firebase Rules & Indexes
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Telegram Webhook Registration
After deploying, register the webhook:
```
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-domain>/api/telegram-webhook&secret_token=<WEBHOOK_SECRET>"
```

## Load Sample Data
Sign in as `nambuharisaran123@gmail.com` → Admin → Settings → **Load Sample Data**

## Vercel Environment Variables Required
| Variable | Source |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Console → Project Settings → Service accounts → Generate new private key (full JSON) |
| `TELEGRAM_BOT_TOKEN` | @BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | Any random 32-char string |
| `CRON_SECRET` | Any random 32-char string |
| `VITE_ADMIN_EMAIL` | `nambuharisaran123@gmail.com` |
| `VITE_TELEGRAM_BOT_USERNAME` | Bot username without @ |

## Firebase Console Setup
1. Authentication → Sign-in method → Enable Google
2. Firestore → Create in Production mode
3. Authentication → Authorized domains → add your Vercel domain + `localhost`
