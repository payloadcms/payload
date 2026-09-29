type GetWelcomeDisplayArgs = {
  useAsTitle?: string
  user?: null | object
}

const getNonEmptyString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() || undefined : undefined

export function getWelcomeDisplay({ useAsTitle, user }: GetWelcomeDisplayArgs): string | undefined {
  const userData = user as null | Record<string, unknown> | undefined
  const email = getNonEmptyString(userData?.email)
  const username = getNonEmptyString(userData?.username)
  const userID =
    typeof userData?.id === 'number' ? String(userData.id) : getNonEmptyString(userData?.id)
  const title = useAsTitle ? getNonEmptyString(userData?.[useAsTitle]) : undefined

  return title ?? username ?? email ?? userID
}
