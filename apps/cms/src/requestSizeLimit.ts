/**
 * Largest request body the CMS accepts, e.g. an upload plus its form fields. Used by Payload
 * (`upload.requestSizeLimit`) and by Next.js for requests that pass through src/proxy.ts, which
 * otherwise cuts bodies at 10 MB and makes larger uploads fail with a 500.
 */
export const requestSizeLimit = 60 * 1024 * 1024
