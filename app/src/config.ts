// Deploy previews must use a separate demo API. Never silently point a preview
// at production: the code display is gated by the server, and preview builds
// should not create test OTPs or accounts in the real ledger.
const isDeployPreview = process.env.EXPO_PUBLIC_BUILD_CONTEXT === 'deploy-preview';
const previewApiUrl = process.env.EXPO_PUBLIC_PREVIEW_API_URL;

export const API_CONFIGURATION_ERROR =
  isDeployPreview && !previewApiUrl
    ? 'The preview API is not configured. Set EXPO_PUBLIC_PREVIEW_API_URL to the isolated demo API.'
    : null;

export const API_BASE_URL = isDeployPreview
  ? (previewApiUrl ?? '')
  : (process.env.EXPO_PUBLIC_API_URL ?? 'https://miniledger-api-imhs.onrender.com');
