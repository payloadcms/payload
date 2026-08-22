/**
 * Folder-name markers that distinguish the supported framework conventions.
 * Shared between import-map resolution and `payload build` framework detection so
 * the two cannot drift.
 */
export const NEXT_PAYLOAD_ROUTE_GROUP = '(payload)'
export const TANSTACK_PAYLOAD_DIR = '_payload'
