import type { Access } from 'payload/config'
import type { AfterChangeHook, AfterDeleteHook } from 'payload/dist/collections/config/types'
import type { PaginatedDocs } from 'payload/dist/mongoose/types'
import type { PayloadRequest } from 'payload/dist/types'

export interface PluginOptions {
  zapierCollectionSlug?: string
  access?: {
    create?: Access
    read?: Access
    update?: Access
    delete?: Access
  }
  collections?: string[]
  enabled?: boolean | ((args: { req: PayloadRequest }) => Promise<boolean> | boolean)
}

export type FindRelatedZaps = (options: {
  zapCollectionSlug: string
  collectionSlug: string
  hook: 'afterChange' | 'afterDelete'
  req: PayloadRequest
}) => Promise<PaginatedDocs>

export type ZapHookArgs = {
  collectionSlug: string
  zapCollectionSlug: string
} & (
  | ({
      hook: 'afterChange'
    } & Parameters<AfterChangeHook>[0])
  | ({
      hook: 'afterDelete'
    } & Parameters<AfterDeleteHook>[0])
)

export type ZapEventHook = (
  args: {
    enabled: boolean | ((args: { req: PayloadRequest }) => Promise<boolean> | boolean)
  } & ZapHookArgs,
) => Promise<void>
