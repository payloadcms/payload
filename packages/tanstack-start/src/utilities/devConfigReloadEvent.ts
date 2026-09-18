/**
 * Custom Vite HMR event the `payload:dev-config-reload` plugin broadcasts when
 * the Payload config (or anything it imports) changes on disk.
 *
 * Kept in its own module so the Vite plugin can name the event without pulling
 * in the server runtime — and therefore the whole CMS — when `vite.config.ts` loads.
 */
export const PAYLOAD_CONFIG_CHANGED_EVENT = 'payload:config-changed'
