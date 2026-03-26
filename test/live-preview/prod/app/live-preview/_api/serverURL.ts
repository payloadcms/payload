// Injected by next.config.mjs from the shared serverURL helper.
// The prod build cannot resolve imports outside the app directory,
// so we read the value via NEXT_PUBLIC_ env var instead.
export const PAYLOAD_SERVER_URL: string = process.env.NEXT_PUBLIC_SERVER_URL!
