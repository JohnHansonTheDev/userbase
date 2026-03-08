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
