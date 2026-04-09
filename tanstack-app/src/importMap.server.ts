import type { ImportMap } from 'payload'

// TanStack server functions serialize their return values before they reach the
// client. Keep the server-side import map empty so the server bundle does not
// eagerly traverse client-only rich text feature modules.
export const importMap: ImportMap = {}
