import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

import { waitForCommit } from '../hooks/revalidateWebsite'

/**
 * Asks the Vigor website to reload its content right after anything under "Vigor website" is
 * saved or deleted, instead of when its cache expires (about a minute).
 *
 * Calls `POST <VIGOR_WEBSITE_URL>/api/revalidate` (server/src/index.ts in the website repo) with
 * `Authorization: Bearer <VIGOR_WEBSITE_REVALIDATE_SECRET>`. Does nothing unless both are set, or
 * when an operation runs with `context: { disableRevalidate: true }` (e.g. scripts/import-vigor.ts).
 * Saving a draft also triggers a reload, which is harmless: the website only reads published content.
 */
const websiteURL = process.env.VIGOR_WEBSITE_URL?.replace(/\/+$/, '') || ''
const secret = process.env.VIGOR_WEBSITE_REVALIDATE_SECRET || ''

export const revalidateVigorAfterChange: CollectionAfterChangeHook = ({ doc, req }) => {
  notifyWebsite({ req })
  return doc
}

export const revalidateVigorAfterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  notifyWebsite({ req })
  return doc
}

export const revalidateVigorGlobal: GlobalAfterChangeHook = ({ doc, req }) => {
  notifyWebsite({ req })
  return doc
}

const notifyWebsite = ({ req }: { req: PayloadRequest }) => {
  if (!websiteURL || !secret || req.context.disableRevalidate) {
    return
  }

  // Not awaited: saving in the admin panel shouldn't wait for the website
  void waitForCommit({ req })
    .then(async () => {
      const res = await fetch(`${websiteURL}/api/revalidate`, {
        headers: {
          Authorization: `Bearer ${secret}`,
        },
        method: 'POST',
        signal: AbortSignal.timeout(10_000),
      })

      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`)
      }

      req.payload.logger.info({ msg: 'Revalidated Vigor website' })
    })
    .catch((err: unknown) => {
      req.payload.logger.error({ err, msg: `Could not revalidate ${websiteURL}` })
    })
}
