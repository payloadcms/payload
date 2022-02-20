import { Payload } from 'payload';
import { CollectionAfterChangeHook, CollectionConfig } from 'payload/types';

export type DocToSync = {
  [key: string]: any
  title: string
  doc: {
    relationTo: string
    value: string
  }
}

export type BeforeSync = (args: {
  originalDoc: {
    [key: string]: any
  }
  searchDoc: DocToSync
  payload: Payload
}) => DocToSync | Promise<DocToSync>;

export type SearchConfig = {
  searchOverrides?: Partial<CollectionConfig>
  collections?: string[]
  defaultPriorities?: {
    [collection: string]: number | ((doc: any) => number | Promise<number>)
  }
  beforeSync?: BeforeSync
  syncOnlyPublished?: boolean
  deleteDrafts?: boolean
}

// TODO: extend this hook with additional args
// searchConfig: SearchConfig
// collection: string
export type SyncWithSearch = CollectionAfterChangeHook;
