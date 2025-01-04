import { sanitizeID } from '@payloadcms/ui/shared'
import { type Locale, logError, type Payload, type TypedUser, type TypeWithID } from 'payload'

type Args = {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
  locale?: Locale
  payload: Payload
  user?: TypedUser
}

export const getDocumentData = async ({
  id: idArg,
  collectionSlug,
  globalSlug,
  locale,
  payload,
  user,
}: Args): Promise<null | Record<string, unknown> | TypeWithID> => {
  const id = sanitizeID(idArg)
  let resolvedData: Record<string, unknown> | TypeWithID = null

  try {
    if (collectionSlug && id) {
      resolvedData = await payload.findByID({
        id,
        collection: collectionSlug,
        depth: 0,
        draft: true,
        fallbackLocale: false,
        locale: locale?.code,
        overrideAccess: false,
        user,
      })
    }

    if (globalSlug) {
      resolvedData = await payload.findGlobal({
        slug: globalSlug,
        depth: 0,
        draft: true,
        fallbackLocale: false,
        locale: locale?.code,
        overrideAccess: false,
        user,
      })
    }
  } catch (err) {
    logError({ err, payload })
  }

  return resolvedData
}
