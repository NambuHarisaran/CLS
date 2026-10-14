# LoyalCart – Setup Checklist

1. **Firebase Console**: Enable Google Sign-In (`Authentication > Sign-in method`). Create Firestore in Production mode. Add your Vercel domain and `localhost` to `Authentication > Authorized domains`.

2. **Deploy rules**: `firebase deploy --only firestore:rules,firestore:indexes`

3. **Service account**: `Firebase Console > Project Settings > Service accounts > Generate new private key`. Copy the JSON and set it as `FIREBASE_SERVICE_ACCOUNT` in Vercel Environment Variables.

4. **Set Vercel env vars**:
   - `TELEGRAM_BOT_TOKEN` — from @BotFather (create a new bot, keep the token secret)
   - `TELEGRAM_WEBHOOK_SECRET` — any random 32-char string
   - `CRON_SECRET` — any random 32-char string
   - `VITE_ADMIN_EMAIL` — `nambuharisaran123@gmail.com`
   - `VITE_TELEGRAM_BOT_USERNAME` — your bot's username without @
   - `FIREBASE_SERVICE_ACCOUNT` — the service account JSON

5. **Deploy to Vercel**: `vercel --prod` or push to GitHub with Vercel connected.

6. **Register Telegram webhook**:
   ```
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-domain>/api/telegram-webhook&secret_token=<WEBHOOK_SECRET>"
   ```

7. **Load sample data**: Sign in as `nambuharisaran123@gmail.com` → Admin → Settings → **Load Sample Data**.
"# CLS" 
