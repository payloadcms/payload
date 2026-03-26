export const PAYLOAD_SERVER_URL =
  typeof process !== 'undefined' && process.env?.PORTLESS_URL
    ? process.env.PORTLESS_URL
    : 'http://payload-monorepo.localhost:1355'
