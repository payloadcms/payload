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
  const response = await sdk.request({
    init,
    method: 'POST',
    path: `/${options.collection}/logout?allSessions=${options.allSessions ?? false}`,
  })

  return response.json()
}
