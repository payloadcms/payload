// Client-side constant — PORTLESS_URL is not a NEXT_PUBLIC_ var so it's never
// available in the browser bundle.  The canonical source of truth for test
// infrastructure is test/__helpers/shared/serverURL.ts; this file exists only
// because Next.js client components cannot import from outside the app directory.
export const PAYLOAD_SERVER_URL = 'http://payload-monorepo.localhost:1355'
