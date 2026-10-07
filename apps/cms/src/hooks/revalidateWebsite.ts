import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  PayloadRequest,
} from 'payload'

import type { Post } from '../payload-types'

/**
 * Asks the personal website to rebuild the pages that show a post right after it is published,
 * edited, unpublished or deleted, instead of waiting for the website's periodic refresh.
 *
 * Calls `POST <WEBSITE_URL>/api/revalidate` (pages/api/revalidate.js in the website repo) with
 * `Authorization: Bearer <WEBSITE_REVALIDATE_SECRET>`. Does nothing unless both are set, or when
 * an operation runs with `context: { disableRevalidate: true }` (e.g. a seed script).
 */
const websiteURL = process.env.WEBSITE_URL?.replace(/\/+$/, '') || ''
const secret = process.env.WEBSITE_REVALIDATE_SECRET || ''

type PostRef = null | Pick<Post, '_status' | 'slug' | 'tags'> | undefined

/**
 * Remembers the live (published) version of a post before it changes. `previousDoc` in afterChange
 * is the latest version instead, which can be a newer draft, e.g. when a post with unpublished
 * edits gets unpublished. Saving a draft leaves the live document in the collection untouched.
 */
export const rememberLivePost: CollectionBeforeChangeHook<Post> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (isEnabled({ req }) && operation === 'update' && originalDoc?.id) {
    const livePost = await req.payload.db.findOne<Post>({
      collection: 'posts',
      req,
      where: { id: { equals: originalDoc.id } },
    })

    req.context[livePostKey({ id: originalDoc.id })] =
      livePost?._status === 'published' ? livePost : null
  }

  return data
}

export const revalidatePostAfterChange: CollectionAfterChangeHook<Post> = ({ doc, req }) => {
  const isPublished = doc._status === 'published'
  const livePost = req.context[livePostKey({ id: doc.id })] as PostRef

  // Published or edited: rebuild its pages, including the old slug and tags if they changed.
  // Unpublished: rebuild the pages that listed it. Drafts of posts that aren't live don't matter.
  if (isPublished || livePost) {
    notifyWebsite({ posts: [isPublished ? doc : null, livePost], req })
  }

  return doc
}

export const revalidatePostAfterDelete: CollectionAfterDeleteHook<Post> = ({ doc, req }) => {
  if (doc?._status === 'published') {
    notifyWebsite({ posts: [doc], req })
  }

  return doc
}

const isEnabled = ({ req }: { req: PayloadRequest }) =>
  Boolean(websiteURL && secret && !req.context.disableRevalidate)

const livePostKey = ({ id }: { id: number | string }) => `revalidateWebsite:livePost:${id}`

const notifyWebsite = ({ posts, req }: { posts: PostRef[]; req: PayloadRequest }) => {
  if (!isEnabled({ req })) {
    return
  }

  const body = {
    collection: 'posts',
    slugs: [...new Set(posts.map((post) => post?.slug).filter(Boolean))],
    tags: [...new Set(posts.flatMap((post) => post?.tags ?? []))],
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
        signal: AbortSignal.timeout(60_000),
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
