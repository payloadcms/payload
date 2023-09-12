import type { User } from '../../payload-types'

export const fetchUser = async (): Promise<User | undefined | null> => {
  const userRes = await fetch(
    `${process.env.NEXT_PUBLIC_CMS_URL}/api/users`,
  ).then(res => res.json())

  return userRes?.docs?.[0] ?? null
}
