export const rest = async <T = any>(
  url: string,
  args?: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  options?: RequestInit,
): Promise<T | undefined> => {
  const method = options?.method || 'POST'

  try {
    const res = await fetch(url, {
      method,
      ...(method === 'POST' ? { body: JSON.stringify(args) } : {}),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    const json = await res.json()

    if (json?.errors) {
      throw new Error(json.errors[0].message)
    }

    if (res.ok) {
      return json as T
    }
  } catch (e: unknown) {
    throw new Error(e as string)
  }
}
