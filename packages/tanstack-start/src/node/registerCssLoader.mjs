/**
 * Tiny shim that registers `./cssLoader.mjs` as a Node ESM loader hook.
 *
 * Used by the test dev-server runner via `node --import ./registerCssLoader.mjs`
 * so the spawned Vite process can swallow stylesheet imports it would
 * otherwise hand to Node's native ESM loader (which throws on `.css`).
 */
import { register } from 'node:module'

register('./cssLoader.mjs', import.meta.url)
