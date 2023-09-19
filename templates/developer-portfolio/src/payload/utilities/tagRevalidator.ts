import type { AfterChangeHook, TypeWithID } from 'payload/dist/collections/config/types'

export const formatAppURL = ({ doc }): string => {
  const { pathname } = new URL(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/projects/${doc.slug}`)
  return pathname
}

// Revalidate the project in the background, so the user doesn't have to wait
// Notice that the hook itself is not async and we are not awaiting `revalidate`
// Only revalidate existing docs that are published
export const tagRevalidator =
  <T extends TypeWithID & { _status?: string }>(getTag: (doc: T) => string): AfterChangeHook<T> =>
  ({ doc, req, operation }) => {
    if (operation === 'update' && (!doc._status || doc._status === 'published')) {
      const revalidate = async (): Promise<void> => {
        const tag = getTag(doc)
        try {
          const res = await fetch(
            `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/revalidate?secret=${process.env.REVALIDATION_KEY}&tag=${tag}`,
          )

          if (res.ok) {
            req.payload.logger.info(`Revalidated tag ${tag}`)
          } else {
            req.payload.logger.error(`Error revalidating tag ${tag}: ${await res.text()}`)
          }
        } catch (err: unknown) {
          req.payload.logger.error(`Error hitting revalidate route for ${tag}`)
        }
      }

      revalidate()
    }

    return doc
  }
