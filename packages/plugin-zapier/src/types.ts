import type { Access } from 'payload/config'
import type {
  AfterChangeHook,
  AfterDeleteHook,
  TypeWithID,
} from 'payload/dist/collections/config/types'
import type { PaginatedDocs } from 'payload/dist/mongoose/types'
import type { PayloadRequest } from 'payload/dist/types'

export type ZapCondition<DocType extends TypeWithID> = (
  args:
    | (Parameters<AfterChangeHook<DocType>>[0] & { hook: 'afterChange'; collectionSlug: string })
    | (Parameters<AfterDeleteHook<DocType>>[0] & { hook: 'afterDelete'; collectionSlug: string }),
) => Promise<boolean>

export interface PluginOptions {
  zapierCollectionSlug?: string
  condition?: ZapCondition<unknown & TypeWithID>
  access?: {
    create?: Access
    read?: Access
    update?: Access
    delete?: Access
  }
  zapCollections: Array<{
    slug: string
    zapHooks: Array<{
      type: 'afterChange' | 'afterDelete'
      condition?: ZapCondition<unknown & TypeWithID>
    }>
  }>
}

export type FindRelatedZaps = (options: {
  zapCollectionSlug: string
  collectionSlug: string
  hook: 'afterChange' | 'afterDelete'
  req: PayloadRequest
}) => Promise<PaginatedDocs>

export type SendZaps = (args: ZapHookArgs) => Promise<void>

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

export type AddZapHook = (
  args: {
    condition?: ZapCondition<unknown & TypeWithID>
  } & ZapHookArgs,
) => Promise<void>
