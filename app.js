import { auth, provider, db } from "./firebase-client.js";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const defaults = {
  billing: {
    starter: "https://buy.stripe.com/REPLACE_STARTER",
    pro: "https://buy.stripe.com/REPLACE_PRO",
    elite: "https://buy.stripe.com/REPLACE_ELITE",
    cancelPortalUrl: "https://billing.stripe.com/p/login/REPLACE_PORTAL_LINK",
  },
  predictionsByTier: {
    none: [
      {
        matchup: "Suns @ Nuggets",
        details: "Sign up to unlock our model pick and confidence for tonight.",
        confidence: "--",
      },
    ],
    starter: [
      {
        matchup: "Celtics @ Knicks",
        details: "Lean: Celtics ML. Pace edge + transition defense mismatch.",
        confidence: "64%",
      },
      {
        matchup: "Suns @ Nuggets",
        details: "Lean: Over 226.5. Both teams in top-10 half-court efficiency this week.",
        confidence: "61%",
      },
    ],
    pro: [
      {
        matchup: "Celtics @ Knicks",
        details: "Play: Celtics -3.5. Model spread -5.1. Injury adjustment: NYK wing depth -1.2 points.",
        confidence: "67%",
      },
      {
        matchup: "Suns @ Nuggets",
        details: "Play: Over 226.5. Possession projection 101.4 + late foul profile high.",
        confidence: "64%",
      },
      {
        matchup: "Lakers @ Warriors",
        details: "Play: Warriors ML. Rest advantage + bench net rating +6.8 over last 5 games.",
        confidence: "62%",
      },
    ],
    elite: [
      {
        matchup: "Celtics @ Knicks",
        details:
          "High-confidence: Celtics -3.5. Triggered by 3-signal alignment (spacing edge, rebounding edge, turnover suppression).",
        confidence: "71%",
      },
      {
        matchup: "Suns @ Nuggets",
        details:
          "Play: Over 226.5. Line movement +2 points still under model total 231.2. Correlated prop: Jokic assists over.",
        confidence: "68%",
      },
      {
        matchup: "Lakers @ Warriors",
        details:
          "Play: Warriors ML. Live-bet trigger if Q1 pace < 48 possessions. Alt spread recommendation: -2.5.",
        confidence: "66%",
      },
      {
        matchup: "Heat @ Bucks",
        details: "Sharp watch: Bucks 1H -2.5 if Lillard active. Volatility flag medium.",
        confidence: "63%",
      },
    ],
  },
};

const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const authStatus = document.getElementById("authStatus");
const activeTierBadge = document.getElementById("activeTierBadge");
const predictionsContainer = document.getElementById("predictions");
const cancelLink = document.getElementById("cancelLink");
const purchaseButtons = document.querySelectorAll(".purchase-btn");

let appConfig = structuredClone(defaults);

function formatAuthError(error) {
  if (error?.code === "auth/configuration-not-found") {
    return "Google sign-in is not configured in Firebase yet. In Firebase Console, enable Authentication → Sign-in method → Google and add your Vercel domain under Authentication → Settings → Authorized domains.";
  }

  return `Google sign-in failed: ${error.message}`;
}

function renderPredictions(tier = "none") {
  const list = appConfig.predictionsByTier[tier] || appConfig.predictionsByTier.none;
  predictionsContainer.innerHTML = list
    .map(
      (pick) => `
      <article class="prediction-item">
        <div>
          <h4>${pick.matchup}</h4>
          <p>${pick.details}</p>
        </div>
        <div class="confidence">${pick.confidence}</div>
      </article>
    `,
    )
    .join("");
}

function normalizeTier(value) {
  const allowed = ["starter", "pro", "elite"];
  return allowed.includes(value) ? value : "none";
}

async function loadAppConfig() {
  const ref = doc(db, "appConfig", "main");
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  appConfig = {
    billing: {
      ...defaults.billing,
      ...(data.billing || {}),
    },
    predictionsByTier: {
      ...defaults.predictionsByTier,
      ...(data.predictionsByTier || {}),
    },
  };
}

async function loadTierForUser(user) {
  const ref = doc(db, "subscriptions", user.uid);
  const snap = await getDoc(ref);
  const tier = snap.exists() ? normalizeTier(snap.data().tier) : "none";
  activeTierBadge.textContent = tier === "none" ? "No active plan" : `${tier.toUpperCase()} plan`;
  renderPredictions(tier);
}

async function saveTierForUser(user, tier) {
  const ref = doc(db, "subscriptions", user.uid);
  await setDoc(
    ref,
    {
      email: user.email,
      tier,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

const query = new URLSearchParams(window.location.search);
const queryTier = normalizeTier(query.get("tier"));
if (queryTier !== "none") localStorage.setItem("cv_pending_tier", queryTier);

signInBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    authStatus.textContent = formatAuthError(error);
  }
});

signOutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

purchaseButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tier = btn.dataset.tier;
    const link = appConfig.billing[tier];
    if (link && !link.includes("REPLACE")) {
      localStorage.setItem("cv_pending_tier", tier);
      window.location.href = link;
      return;
    }
    authStatus.textContent = "Stripe links are not configured yet. Ask admin to update /admin.";
  });
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    authStatus.textContent = "Sign in with Google to activate your account.";
    signInBtn.classList.remove("hidden");
    signOutBtn.classList.add("hidden");
    cancelLink.classList.add("hidden");
    activeTierBadge.textContent = "No active plan";
    renderPredictions("none");
    return;
  }

  signInBtn.classList.add("hidden");
  signOutBtn.classList.remove("hidden");
  cancelLink.classList.remove("hidden");
  cancelLink.href = appConfig.billing.cancelPortalUrl;
  authStatus.textContent = `Signed in as ${user.email}.`;

  const pendingTier = normalizeTier(localStorage.getItem("cv_pending_tier"));
  if (pendingTier !== "none") {
    await saveTierForUser(user, pendingTier);
    localStorage.removeItem("cv_pending_tier");
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("tier");
    window.history.replaceState({}, "", cleanUrl.toString());
  }

  await loadTierForUser(user);
});

await loadAppConfig();
renderPredictions();
