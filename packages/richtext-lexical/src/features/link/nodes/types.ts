// Re-export the runtime types from the colocated schema module so existing
// imports of this path keep working. The canonical definitions live in
// `../server/schema.ts` next to the JSON Schema builders and the inlined-
// into-payload-types TS source string.
export type { LinkFields, SerializedAutoLinkNode, SerializedLinkNode } from '../server/schema.js'
