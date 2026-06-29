import {
  type Locale,
  logError,
  type Payload,
  type PayloadRequest,
  type User,
  type TypeWithID,
} from 'payload'

import { sanitizeID } from '../utilities/sanitizeID.js'

type Args = {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
  locale?: Locale
  payload: Payload
  req?: PayloadRequest
  segments?: string[]
  user?: User
}

export const getDocumentData = async ({
  id: idArg,
  collectionSlug,
  globalSlug,
  locale,
  payload,
  req,
  segments,
  user,
}: Args): Promise<null | Record<string, unknown> | TypeWithID> => {
  const id = sanitizeID(idArg)
  let resolvedData: Record<string, unknown> | TypeWithID = null
  const { transactionID, ...rest } = req

  const isTrashedDoc = segments?.[2] === 'trash' && typeof segments?.[3] === 'string' // id exists at segment 3

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
          ...rest,
        },
        trash: isTrashedDoc ? true : false,
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
          ...rest,
        },
        user,
      })
    }
  } catch (err) {
    logError({ err, payload })
  }

  return resolvedData
}
