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

const ADMIN_EMAILS = ["REPLACE_WITH_YOUR_GMAIL@gmail.com"];

const defaultSettings = {
  billing: {
    starter: "https://buy.stripe.com/REPLACE_STARTER",
    pro: "https://buy.stripe.com/REPLACE_PRO",
    elite: "https://buy.stripe.com/REPLACE_ELITE",
    cancelPortalUrl: "https://billing.stripe.com/p/login/REPLACE_PORTAL_LINK",
  },
  predictionsByTier: {
    starter: [],
    pro: [],
    elite: [],
  },
};

const adminStatus = document.getElementById("adminStatus");
const adminPanel = document.getElementById("adminPanel");
const predictionsPanel = document.getElementById("predictionsPanel");
const adminSignInBtn = document.getElementById("adminSignInBtn");
const adminSignOutBtn = document.getElementById("adminSignOutBtn");
const saveBtn = document.getElementById("saveBtn");

const starterLink = document.getElementById("starterLink");
const proLink = document.getElementById("proLink");
const eliteLink = document.getElementById("eliteLink");
const cancelPortalUrl = document.getElementById("cancelPortalUrl");

const starterPredictions = document.getElementById("starterPredictions");
const proPredictions = document.getElementById("proPredictions");
const elitePredictions = document.getElementById("elitePredictions");

function formatAuthError(error) {
  if (error?.code === "auth/configuration-not-found") {
    return "Google sign-in is not configured in Firebase yet. Enable Authentication → Sign-in method → Google and add your domain under Authentication → Settings → Authorized domains.";
  }

  return `Sign in failed: ${error.message}`;
}

function isAllowedAdmin(email) {
  return ADMIN_EMAILS.includes(email);
}

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

async function loadSettings() {
  const snap = await getDoc(doc(db, "appConfig", "main"));
  const settings = snap.exists() ? snap.data() : defaultSettings;

  starterLink.value = settings.billing?.starter || "";
  proLink.value = settings.billing?.pro || "";
  eliteLink.value = settings.billing?.elite || "";
  cancelPortalUrl.value = settings.billing?.cancelPortalUrl || "";

  starterPredictions.value = formatJson(settings.predictionsByTier?.starter || []);
  proPredictions.value = formatJson(settings.predictionsByTier?.pro || []);
  elitePredictions.value = formatJson(settings.predictionsByTier?.elite || []);
}

function parsePredictionJson(text, tierName) {
  let parsed;
  try {
    parsed = JSON.parse(text || "[]");
  } catch {
    throw new Error(`${tierName} JSON is invalid.`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`${tierName} must be an array.`);
  }

  return parsed;
}

adminSignInBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    adminStatus.textContent = formatAuthError(error);
  }
});

adminSignOutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

saveBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user || !isAllowedAdmin(user.email)) return;

  let starter;
  let pro;
  let elite;

  try {
    starter = parsePredictionJson(starterPredictions.value, "Starter");
    pro = parsePredictionJson(proPredictions.value, "Pro");
    elite = parsePredictionJson(elitePredictions.value, "Elite");
  } catch (error) {
    adminStatus.textContent = error.message;
    return;
  }

  await setDoc(
    doc(db, "appConfig", "main"),
    {
      billing: {
        starter: starterLink.value.trim(),
        pro: proLink.value.trim(),
        elite: eliteLink.value.trim(),
        cancelPortalUrl: cancelPortalUrl.value.trim(),
      },
      predictionsByTier: {
        starter,
        pro,
        elite,
      },
      updatedBy: user.email,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  adminStatus.textContent = "Saved. Settings are remembered and live on the main site.";
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    adminStatus.textContent = "Sign in with Google to access admin controls.";
    adminSignInBtn.classList.remove("hidden");
    adminSignOutBtn.classList.add("hidden");
    adminPanel.style.display = "none";
    predictionsPanel.style.display = "none";
    return;
  }

  if (!isAllowedAdmin(user.email)) {
    adminStatus.textContent = `Signed in as ${user.email}, but this account is not an allowed admin.`;
    adminSignInBtn.classList.add("hidden");
    adminSignOutBtn.classList.remove("hidden");
    adminPanel.style.display = "none";
    predictionsPanel.style.display = "none";
    return;
  }

  adminStatus.textContent = `Admin signed in: ${user.email}`;
  adminSignInBtn.classList.add("hidden");
  adminSignOutBtn.classList.remove("hidden");
  adminPanel.style.display = "block";
  predictionsPanel.style.display = "block";

  await loadSettings();
});
