const normalizeUrl = (url) => String(url || "").trim().replace(/\/$/, "");

const frontendUrl = normalizeUrl(process.env.FRONTEND_URL);
const backendUrl = normalizeUrl(process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL);

export const getFrontendUrl = () => frontendUrl;

export const getAllowedOrigins = () => {
  const origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    frontendUrl,
  ]
    .filter(Boolean)
    .map(normalizeUrl);

  return [...new Set(origins)];
};

export const getGoogleCallbackUrl = () => {
  const configuredCallbackUrl = normalizeUrl(process.env.GOOGLE_CALLBACK_URL);
  if (configuredCallbackUrl) return configuredCallbackUrl;
  if (backendUrl) return `${backendUrl}/api/auth/google/callback`;
  return "http://localhost:5000/api/auth/google/callback";
};

export const warnIfDeploymentUrlsMissing = () => {
  if (process.env.NODE_ENV !== "production") return;

  const missing = [];
  if (!frontendUrl) missing.push("FRONTEND_URL");
  if (!process.env.GOOGLE_CALLBACK_URL && !backendUrl) {
    missing.push("GOOGLE_CALLBACK_URL or BACKEND_URL/RENDER_EXTERNAL_URL");
  }

  if (missing.length > 0) {
    console.warn(
      `Missing production URL configuration: ${missing.join(", ")}. ` +
        "Set your Vercel frontend URL and Render backend URL env vars before deploying auth flows."
    );
  }
};
