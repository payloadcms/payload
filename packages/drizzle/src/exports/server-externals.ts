/**
 * Anything in this file won't be part of the Next.js server bundle, as it's part of serverExternalPackages.
 * Note: This is re-exported by db adapters (db-postgres, db-sqlite, etc.) which ARE installed by users.
 */

export * as drizzleKit from 'drizzle-kit'

