import type { User } from '../auth'

type Args = {
  defaultValue: unknown
  locale: string | undefined
  user: User
  value?: unknown
}

const getValueWithDefault = async ({
  defaultValue,
  locale,
  user,
  value,
}: Args): Promise<unknown> => {
  if (typeof value !== 'undefined') {
    return value
  }

  if (defaultValue && typeof defaultValue === 'function') {
    return defaultValue({ locale, user })
  }

  return defaultValue
}

export default getValueWithDefault
