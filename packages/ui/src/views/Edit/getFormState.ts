import { SanitizedCollectionConfig, SanitizedConfig, SanitizedGlobalConfig } from 'payload/types'
import { FormState } from '../../forms/Form/types'
import { BuildFormStateArgs } from '../..'

export const getFormState = async (args: {
  serverURL: SanitizedConfig['serverURL']
  apiRoute: SanitizedConfig['routes']['api']
  collectionSlug?: SanitizedCollectionConfig['slug']
  globalSlug?: SanitizedGlobalConfig['slug']
  body: BuildFormStateArgs
}): Promise<FormState> => {
  const { serverURL, apiRoute, collectionSlug, globalSlug, body } = args

  const res = await fetch(`${serverURL}${apiRoute}/${collectionSlug || globalSlug}/form-state`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (res.ok) {
    const json = (await res.json()) as FormState
    return json
  }

  return body?.formState
}
