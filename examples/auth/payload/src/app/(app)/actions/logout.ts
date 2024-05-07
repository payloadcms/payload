'use server'
import { randomUUID } from 'crypto'
import { cookies as getCookies } from 'next/headers'

import { getUser } from './getUser'

export const logout = async (): Promise<void> => {
  const cookies = getCookies()
  cookies.delete('payload-token')
  const uuid = randomUUID()

  // invalidate the cached user
  await getUser(undefined, uuid)
}
