import type { ClientCollectionConfig, ClientGlobalConfig } from 'payload/types'

export type Props = {
  collection?: ClientCollectionConfig
  global?: ClientGlobalConfig
  id?: number | string
  publishedDocUpdatedAt: string
}
