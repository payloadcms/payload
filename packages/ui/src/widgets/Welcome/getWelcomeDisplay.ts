type GetWelcomeDisplayArgs = {
  useAsTitle?: string
  user?: null | object
}

const getDisplayString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return value.trim() || undefined
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return undefined
}

export function getWelcomeDisplay({ useAsTitle, user }: GetWelcomeDisplayArgs): string | undefined {
  const userData = user as null | Record<string, unknown> | undefined
  const email = getDisplayString(userData?.email)
  const username = getDisplayString(userData?.username)
  const userID = getDisplayString(userData?.id)
  const title = useAsTitle ? getDisplayString(userData?.[useAsTitle]) : undefined

  return title ?? username ?? email ?? userID
}
