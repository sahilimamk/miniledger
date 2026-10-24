// Base URL of the MiniLedger API server.
//
// The default works when the app runs on this machine (simulator / web).
// On a physical device, "localhost" is the phone itself — replace this with
// the development machine's LAN IP, e.g. "http://192.168.1.10:4000".
//
// For a deployed build, set EXPO_PUBLIC_API_URL at build time:
//   EXPO_PUBLIC_API_URL=https://miniledger-api.onrender.com npx expo export --platform web
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
