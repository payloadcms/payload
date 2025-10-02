import type { PayloadSDK } from '../index.js'
import type {
  AuthCollectionSlug,
  PayloadGeneratedTypes,
} from '../types.js'

export type LogoutOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends AuthCollectionSlug<T>
> = {
  collection: TSlug
  allSessions?: boolean
}

export type LogoutResult = {
  message: string
}

export async function logout<
  T extends PayloadGeneratedTypes,
  TSlug extends AuthCollectionSlug<T>
>(
  sdk: PayloadSDK<T>,
  options: LogoutOptions<T, TSlug>,
  init?: RequestInit,
): Promise<LogoutResult> {
  const url = `/${options.collection}/logout?allSessions=${options.allSessions ?? false}`

  const response = await sdk.request({
    init,
    method: 'POST',
    path: url,
  })

  return response.json()
}
