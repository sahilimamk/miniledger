// Base URL of the MiniLedger API server.
//
// Defaults to the live Render deployment. Override with EXPO_PUBLIC_API_URL
// at build time for a different environment, or swap to a LAN IP when
// running against a local server on a physical device:
//   e.g. "http://192.168.1.10:4000"
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://miniledger-api-imhs.onrender.com';
