import type { AfterChangeHook } from 'payload/dist/collections/config/types'

// ensure that the home page is revalidated at '/' instead of '/home'
export const formatAppURL = ({ doc }): string => {
  const pathToUse = doc.slug === 'home' ? '' : doc.slug
  const { pathname } = new URL(`${process.env.PAYLOAD_PUBLIC_SITE_URL}/${pathToUse}`)
  return pathname
}

// revalidate the page in the background, so the user doesn't have to wait
// notice that the hook itself is not async and we are not awaiting `revalidate`
// only revalidate existing docs that are published (not drafts)
// send `revalidatePath`, `collection`, and `slug` to the frontend to use in its revalidate route
// frameworks may have different ways of doing this, but the idea is the same
export const revalidatePage: AfterChangeHook = ({ doc, req, operation }) => {
  if (operation === 'update' && doc._status === 'published') {
    const url = formatAppURL({ doc })

    const revalidate = async (): Promise<void> => {
      try {
        const res = await fetch(
          `${process.env.PAYLOAD_PUBLIC_SITE_URL}/api/revalidate?secret=${process.env.REVALIDATION_KEY}&collection=pages&slug=${doc?.slug}&path=${url}`,
        )

        if (res.ok) {
          req.payload.logger.info(`Revalidated path ${url}`)
        } else {
          req.payload.logger.error(`Error revalidating path ${url}`)
        }
      } catch (err: unknown) {
        req.payload.logger.error(`Error hitting revalidate route for ${url}`)
      }
    }

    revalidate()
  }

  return doc
}
