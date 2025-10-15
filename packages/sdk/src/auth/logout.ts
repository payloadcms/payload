import type { PayloadSDK } from '../index.js'
import type {
  AuthCollectionSlug,
  PayloadGeneratedTypes,
} from '../types.js'

export type LogoutOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends AuthCollectionSlug<T>
> = {
  allSessions?: boolean
  collection: TSlug
}

export type LogoutResult = {
  headers: Headers
  message: string
  status: number
}

export async function logout<
  T extends PayloadGeneratedTypes,
  TSlug extends AuthCollectionSlug<T>
>(
  sdk: PayloadSDK<T>,
  options: LogoutOptions<T, TSlug>,
  init?: RequestInit,
): Promise<LogoutResult> {
  const response = await sdk.request({
    init,
    method: 'POST',
    path: `/${options.collection}/logout?allSessions=${options.allSessions ?? false}`,
  })
  const data = await response.json()
  return {
    headers: response.headers,
    message: data.message,
    status: response.status,
  }
}
