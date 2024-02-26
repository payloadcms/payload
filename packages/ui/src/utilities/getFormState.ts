import type { SanitizedConfig } from 'payload/types'

import type { BuildFormStateArgs } from '..'
import type { FormState } from '../forms/Form/types'

export const getFormState = async (args: {
  apiRoute: SanitizedConfig['routes']['api']
  body: BuildFormStateArgs
  serverURL: SanitizedConfig['serverURL']
}): Promise<FormState> => {
  const { apiRoute, body, serverURL } = args

  const res = await fetch(`${serverURL}${apiRoute}/form-state`, {
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
