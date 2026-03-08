# CourtVision Pro (Vercel-ready)

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
