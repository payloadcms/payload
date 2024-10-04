import type { BuildFormStateArgs, ClientUser, FormState, SanitizedConfig } from 'payload'

export const getFormStateFetch = async (args: {
  apiRoute: SanitizedConfig['routes']['api']
  body: Omit<BuildFormStateArgs, 'req'>
  onError?: (data?: any) => Promise<void> | void
  serverURL: SanitizedConfig['serverURL']
  signal?: AbortSignal
  token?: string
}): Promise<{ lockedState?: { isLocked: boolean; user: ClientUser }; state: FormState }> => {
  const { apiRoute, body, onError, serverURL, signal, token } = args

  const res = await fetch(`${serverURL}${apiRoute}/form-state`, {
    body: JSON.stringify(body),
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `JWT ${token}` } : {}),
    },
    method: 'POST',
    signal,
  })

  const json = (await res.json()) as {
    lockedState?: { isLocked: boolean; user: ClientUser }
    state: FormState
  }

  if (res.ok) {
    return json
  } else {
    if (typeof onError === 'function') {
      void onError(json)
    }
  }

  return { state: body?.formState }
}
