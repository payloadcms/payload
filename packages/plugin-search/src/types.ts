import { CollectionConfig } from 'payload/types';

export type SearchConfig = {
  searchOverrides?: Partial<CollectionConfig>
  collections?: string[]
  defaultPriorities?: {
    [collection: string]: number
  }
}
