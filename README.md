# CourtVision Pro (Vercel-ready)

A Vercel-deployable NBA picks site with:

- Google signup/login (Firebase Auth)
- 3 paid tiers ($5 / $10 / $15)
- Cancel subscription button
- Tier-based predictions on the main page
- Admin page to manage billing links + prediction content and persist settings in Firestore

## Pages

- `/` main customer site
- `/admin` admin dashboard (Google sign-in required + email allowlist)

## Firebase setup

1. Create Firebase project (or use the included one in `firebase-client.js`).
2. Enable **Authentication → Google**.
3. Create Firestore.
4. In `admin.js`, update `ADMIN_EMAILS` with your Gmail.

## Firestore data model

- `subscriptions/{uid}` → `{ email, tier, updatedAt }`
- `appConfig/main` → `{ billing, predictionsByTier, updatedBy, updatedAt }`

## Stripe setup

1. Create monthly products/prices:
   - Starter: $5
   - Pro: $10
   - Elite: $15
2. Create Payment Links for each price.
3. In `/admin`, set:
   - Starter link
   - Pro link
   - Elite link
   - Billing portal cancel URL
4. Set Stripe success/return URLs to:
   - `https://your-domain.com/?tier=starter`
   - `https://your-domain.com/?tier=pro`
   - `https://your-domain.com/?tier=elite`

## Security rules (recommended baseline)
A modern static web app you can host on Vercel where users can:

- Sign up / sign in with Gmail (Firebase Authentication)
- Buy one of three subscription tiers ($5, $10, $15) through Stripe Payment Links
- Cancel subscription through Stripe Customer Portal
- View NBA predictions based on active tier

## Tech used

- Static HTML/CSS/JS (fast and simple deploy)
- Firebase Auth (Google provider)
- Firestore (stores per-user tier)
- Stripe Payment Links + Billing Portal

## 1) Firebase setup

1. Create a Firebase project.
2. Enable **Authentication > Sign-in method > Google**.
3. Create a **Firestore database**.
4. In project settings, copy your web app credentials.
5. Replace placeholders in `app.js` under `firebaseConfig`.

### Firestore security rule example

Use rules that only allow each signed-in user to read/write their own subscription doc:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /subscriptions/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /appConfig/main {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email in ["REPLACE_WITH_YOUR_GMAIL@gmail.com"];
    }
  }
}
```

## Deploy on Vercel

1. Push to GitHub.
2. Import repo in Vercel.
3. Deploy (static, no build step required).
  }
}
```

## 2) Stripe setup

1. Create 3 Stripe recurring products/prices:
   - Starter: $5/month
   - Pro: $10/month
   - Elite: $15/month
2. Create a **Payment Link** for each price.
3. Set each payment link return URL to your site with a tier query:
   - `https://your-domain.com/?tier=starter`
   - `https://your-domain.com/?tier=pro`
   - `https://your-domain.com/?tier=elite`
4. Create a **Billing Portal** configuration and copy portal URL.
5. Replace placeholders in `app.js`:
   - `stripeLinks.starter`
   - `stripeLinks.pro`
   - `stripeLinks.elite`
   - `cancelPortalUrl`

## 3) Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Deploy (no build configuration needed).

## Notes

- This approach is intentionally simple and quick to launch.
- For production-grade entitlement verification, add a backend webhook that syncs Stripe subscription status to Firestore.
