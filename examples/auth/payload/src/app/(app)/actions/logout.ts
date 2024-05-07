'use server'
import { revalidateTag } from 'next/cache'
import { cookies as getCookies } from 'next/headers'

export const logout = (): void => {
  const cookies = getCookies()
  cookies.delete('payload-token')
  revalidateTag('payload-user')
}
