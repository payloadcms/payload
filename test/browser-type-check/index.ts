// test/browser-type-check/index.ts
// This file type-checks in a browser-only TypeScript environment (no @types/node).
// If any import below transitively pulls in @types/node, setTimeout() will return
// NodeJS.Timeout instead of the DOM `number`, causing the assignment below to fail.
import type { RichText } from '@payloadcms/richtext-lexical/react'
// import type { PayloadSDK } from '@payloadcms/sdk'

// Proof that DOM globals are intact and @types/node has NOT leaked in.

const _checkBrowserGlobals: number = setTimeout(() => {}, 0)

// Suppress unused import warnings — the imports above exist only to trigger
// TypeScript's type-chain resolution.

// type _RichText = typeof RichText

// type _SDK = PayloadSDK
