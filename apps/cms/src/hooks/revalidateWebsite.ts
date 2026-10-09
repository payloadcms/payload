import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionSlug,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

/**
 * Asks the personal website to rebuild the pages that show a document right after it is published,
 * edited, unpublished or deleted, instead of waiting for the website's periodic refresh: posts,
 * projects, its pages in Pages, and the pages and settings under "Personal website".
 *
 * Calls `POST <WEBSITE_URL>/api/revalidate` (pages/api/revalidate.js in the website repo) with
 * `Authorization: Bearer <WEBSITE_REVALIDATE_SECRET>` and what changed: `{ collection, slugs,
 * tags }` for documents, `{ global }` for a page or the site settings. Does nothing unless both are
 * set, or when an operation runs with `context: { disableRevalidate: true }` (e.g. an import
 * script).
 */
const websiteURL = process.env.WEBSITE_URL?.replace(/\/+$/, '') || ''
const secret = process.env.WEBSITE_REVALIDATE_SECRET || ''

type WebsiteDoc = {
  _status?: 'draft' | 'published' | null
  id: number | string
  sites?: null | string[]
  slug?: null | string
  tags?: null | string[]
}

/**
 * Hooks for a collection with drafts whose published documents appear on the website.
 * `isOnWebsite` tells whether a document is shown there at all, e.g. a page of another site isn't.
 */
export const revalidateWebsiteCollection = ({
  isOnWebsite = () => true,
}: {
  isOnWebsite?: (doc: WebsiteDoc) => boolean
} = {}) => {
  /**
   * Remembers the live (published) version of a document before it changes. `previousDoc` in
   * afterChange is the latest version instead, which can be a newer draft, e.g. when a post with
   * unpublished edits gets unpublished. Saving a draft leaves the live document untouched.
   */
  const beforeChange: CollectionBeforeChangeHook = async ({
    collection,
    data,
    operation,
    originalDoc,
    req,
  }) => {
    if (isEnabled({ req }) && operation === 'update' && originalDoc?.id) {
      const liveDoc = await req.payload.db.findOne<WebsiteDoc>({
        collection: collection.slug as CollectionSlug,
        req,
        where: { id: { equals: originalDoc.id } },
      })

      req.context[liveDocKey({ collection: collection.slug, id: originalDoc.id })] =
        liveDoc?._status === 'published' ? liveDoc : null
    }

    return data
  }

  const afterChange: CollectionAfterChangeHook = ({ collection, doc, req }) => {
    const isPublished = doc._status === 'published'
    const liveDoc = req.context[liveDocKey({ collection: collection.slug, id: doc.id })] as
      | null
      | undefined
      | WebsiteDoc

    // Published or edited: rebuild its pages, including the old slug and tags if they changed.
    // Unpublished: rebuild the pages that listed it. Drafts of documents that aren't live don't
    // matter.
    notifyAboutDocs({
      collection: collection.slug,
      docs: [isPublished ? (doc as WebsiteDoc) : null, liveDoc],
      isOnWebsite,
      req,
    })

    return doc
  }

  const afterDelete: CollectionAfterDeleteHook = ({ collection, doc, req }) => {
    if (doc?._status === 'published') {
      notifyAboutDocs({ collection: collection.slug, docs: [doc as WebsiteDoc], isOnWebsite, req })
    }

    return doc
  }

  return { afterChange, afterDelete, beforeChange }
}

/** For the globals under "Personal website": they have no drafts, so every save is live */
export const revalidateWebsiteGlobal: GlobalAfterChangeHook = ({ doc, global, req }) => {
  notifyWebsite({ body: { global: global.slug }, req })
  return doc
}

const isEnabled = ({ req }: { req: PayloadRequest }) =>
  Boolean(websiteURL && secret && !req.context.disableRevalidate)

const liveDocKey = ({ collection, id }: { collection: string; id: number | string }) =>
  `revalidateWebsite:liveDoc:${collection}:${id}`

const notifyAboutDocs = ({
  collection,
  docs,
  isOnWebsite,
  req,
}: {
  collection: string
  docs: (null | undefined | WebsiteDoc)[]
  isOnWebsite: (doc: WebsiteDoc) => boolean
  req: PayloadRequest
}) => {
  const shownDocs = docs.filter((doc): doc is WebsiteDoc => Boolean(doc && isOnWebsite(doc)))

  if (shownDocs.length === 0) {
    return
  }

  notifyWebsite({
    body: {
      collection,
      slugs: [...new Set(shownDocs.map((doc) => doc.slug).filter(Boolean))],
      tags: [...new Set(shownDocs.flatMap((doc) => doc.tags ?? []))],
    },
    req,
  })
}

const notifyWebsite = ({ body, req }: { body: Record<string, unknown>; req: PayloadRequest }) => {
  if (!isEnabled({ req })) {
    return
  }

  // Not awaited: saving in the admin panel shouldn't wait for the website
  void waitForCommit({ req })
    .then(async () => {
      const res = await fetch(`${websiteURL}/api/revalidate`, {
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        // Site settings rebuild every page
        signal: AbortSignal.timeout(120_000),
      })

      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`)
      }

      const { revalidated } = (await res.json().catch(() => ({}))) as { revalidated?: string[] }

      req.payload.logger.info({ msg: 'Revalidated website', paths: revalidated })
    })
    .catch((err: unknown) => {
      req.payload.logger.error({ err, msg: `Could not revalidate ${websiteURL}` })
    })
}

/**
 * Payload runs afterChange/afterDelete hooks before it commits the database transaction (only on
 * a MongoDB replica set; a standalone server has no transactions). While one is open,
 * `req.transactionID` holds its ID, which Payload deletes once it commits or rolls back.
 */
export const waitForCommit = async ({ req }: { req: PayloadRequest }) => {
  const deadline = Date.now() + 30_000
  const hasOpenTransaction = () =>
    typeof req.transactionID === 'string' || typeof req.transactionID === 'number'

  while (hasOpenTransaction() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}
