import type { TypeWithID } from '../collections/config/types.js'
import type {
  Count,
  CountArgs,
  CreateArgs,
  DeleteManyArgs,
  DeleteOneArgs,
  FindArgs,
  FindGlobalArgs,
  FindOneArgs,
  PaginatedDocs,
  QueryDraftsArgs,
  UpdateGlobalArgs,
  UpdateOneArgs,
} from '../database/types.js'
import type { PayloadRequest } from '../types/index.js'

type Callback = (...args: unknown[]) => Promise<unknown>

export type TTLResolveFunction = (
  args: { draft?: boolean } & (
    | {
        operation: 'count'
        operationArgs: CountArgs
      }
    | {
        operation: 'find'
        operationArgs: FindArgs
      }
    | {
        operation: 'findGlobal'
        operationArgs: FindGlobalArgs
      }
    | {
        operation: 'findOne'
        operationArgs: FindOneArgs
      }
  ),
) => false | number

export type DatabaseCacheStorage = {
  cacheFn<T extends Callback>(
    callback: T,
    keyParts: string[],
    tags: string[],
    ttl?: TTLResolveFunction | false | number,
  ): T
  invalidateTags(tags: string[]): Promise<void> | void
}

export type InvalidateCacheFunction = (
  req: PayloadRequest,
  options: { draft?: 'all' | boolean } & (
    | {
        args: CreateArgs
        operation: 'create'
      }
    | {
        args: DeleteManyArgs
        operation: 'deleteMany'
      }
    | {
        args: DeleteOneArgs
        operation: 'deleteOne'
      }
    | {
        args: UpdateGlobalArgs
        operation: 'updateGlobal'
      }
    | {
        args: UpdateOneArgs
        operation: 'updateOne'
      }
  ),
) => Promise<void>

type WithDraft<T extends Record<string, unknown>> = { draft?: boolean } & T

export type DatabaseCachedFindArgs = WithDraft<FindArgs>

export type DatabaseCachedFindGlobalArgs = WithDraft<FindGlobalArgs>

export type DatabaseCachedFindOneArgs = WithDraft<FindOneArgs>

export type DatabaseCache = {
  count: Count
  find: <T = TypeWithID>(args: WithDraft<FindArgs>) => Promise<PaginatedDocs<T>>
  findGlobal: <T extends Record<string, unknown>>(args: WithDraft<FindGlobalArgs>) => Promise<T>
  findOne: <T = TypeWithID>(args: WithDraft<FindOneArgs>) => Promise<T | null>
  invalidateCache: InvalidateCacheFunction
} & DatabaseCacheStorage

export type DatabaseCacheOptions = {
  /** @default false */
  logging?: boolean

  /** @default 3600000 - '1 hour'  */
  ttl?: false | number
}
