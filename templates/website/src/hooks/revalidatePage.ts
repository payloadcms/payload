import type { AfterChangeHook } from 'payload/dist/collections/config/types'

// ensure that the home page is revalidated at '/' instead of '/home'
export const formatAppURL = ({ doc }): string => {
  const pathToUse = doc.slug === 'home' ? '' : doc.slug
  const { pathname } = new URL(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/${pathToUse}`)
  return pathname
}

// Revalidate the page in the background, so the user doesn't have to wait
// Notice that the hook itself is not async and we are not awaiting `revalidate`
export const revalidatePage: AfterChangeHook = ({ doc, req }) => {
  const revalidate = async (): Promise<void> => {
    let url

    try {
      url = formatAppURL({ doc })
      const res = await fetch(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/next/revalidate?secret=${process.env.REVALIDATION_KEY}&revalidatePath=${url}`,
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

  return doc
}
