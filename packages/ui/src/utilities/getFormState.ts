import type { FormState, SanitizedConfig } from 'payload/types'

import type { BuildFormStateArgs } from '../forms/buildStateFromSchema/index.js'

export const getFormState = async (args: {
  apiRoute: SanitizedConfig['routes']['api']
  body: BuildFormStateArgs
  onError?: (data?: any) => Promise<void> | void
  serverURL: SanitizedConfig['serverURL']
  signal?: AbortSignal
}): Promise<FormState> => {
  const { apiRoute, body, onError, serverURL, signal } = args

  const res = await fetch(`${serverURL}${apiRoute}/form-state`, {
    body: JSON.stringify(body),
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal,
  })

  const json = (await res.json()) as FormState

  if (res.ok) {
    return json
  } else {
    void onError(json)
  }

  return body?.formState
}
