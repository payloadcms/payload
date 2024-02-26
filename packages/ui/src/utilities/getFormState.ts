import { SanitizedCollectionConfig, SanitizedConfig, SanitizedGlobalConfig } from 'payload/types'

import type { BuildFormStateArgs } from '..'
import type { FormState } from '../forms/Form/types'

export const getFormState = async (args: {
  apiRoute: SanitizedConfig['routes']['api']
  collectionSlug?: SanitizedCollectionConfig['slug']
  globalSlug?: SanitizedGlobalConfig['slug']
  body: BuildFormStateArgs
  serverURL: SanitizedConfig['serverURL']
}): Promise<FormState> => {
  const { serverURL, apiRoute, collectionSlug, globalSlug, body } = args

  const res = await fetch(`${serverURL}${apiRoute}/${collectionSlug || globalSlug}/form-state`, {
    body: JSON.stringify(body),
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (res.ok) {
    const json = (await res.json()) as FormState
    return json
  }

  return body?.formState
}
