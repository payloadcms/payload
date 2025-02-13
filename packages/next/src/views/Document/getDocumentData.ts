import { sanitizeID } from '@payloadcms/ui/shared'
import {
  captureError,
  type Locale,
  logError,
  type Payload,
  type PayloadRequest,
  type TypedUser,
  type TypeWithID,
} from 'payload'

type Args = {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
  locale?: Locale
  payload: Payload
  req?: PayloadRequest
  user?: TypedUser
}

export const getDocumentData = async ({
  id: idArg,
  collectionSlug,
  globalSlug,
  locale,
  payload,
  req,
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
        req: {
          query: req?.query,
          search: req?.search,
          searchParams: req?.searchParams,
        },
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
        req: {
          query: req?.query,
          search: req?.search,
          searchParams: req?.searchParams,
        },
        user,
      })
    }
  } catch (err) {
    let msg: string
    if (globalSlug) {
      msg = `Failed to retrieve global ${globalSlug} data `
    } else {
      msg = `Failed to retrieve collection ${collectionSlug} document with ID-${idArg} data`
    }
    await captureError({ err, msg, req })
  }

  return resolvedData
}
