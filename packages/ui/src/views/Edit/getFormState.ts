import { SanitizedConfig } from 'payload/types'
import { FormState } from '../../forms/Form/types'
import { BuildFormStateArgs } from '../..'

export const getFormState = async (args: {
  serverURL: SanitizedConfig['serverURL']
  apiRoute: SanitizedConfig['routes']['api']
  body: BuildFormStateArgs
}): Promise<FormState> => {
  const { serverURL, apiRoute, body } = args

  const res = await fetch(`${serverURL}${apiRoute}/form-state`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  if (res.ok) {
    const json = (await res.json()) as FormState
    return json
  }

  return body?.formState
}
