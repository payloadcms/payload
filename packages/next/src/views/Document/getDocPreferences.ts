import type { DocumentPreferences, Payload, PayloadRequest, TypedUser } from 'payload'

import { sanitizeID } from '@payloadcms/ui/shared'

type Args = {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
  payload: Payload
  req: PayloadRequest
  user: TypedUser
}

export const getDocPreferences = async ({
  id,
  collectionSlug,
  globalSlug,
  payload,
  req,
  user,
}: Args): Promise<DocumentPreferences> => {
  let preferencesKey

  if (collectionSlug && id) {
    preferencesKey = `collection-${collectionSlug}-${id}`
  }

  if (globalSlug) {
    preferencesKey = `global-${globalSlug}`
  }

  if (preferencesKey) {
    const preferencesResult = (await payload.findPreferenceByKey({
      key: preferencesKey,
      req,
      user,
    })) as unknown as { value: DocumentPreferences }

    if (preferencesResult?.value) {
      return preferencesResult.value
    }
  }

  return { fields: {} }
}
