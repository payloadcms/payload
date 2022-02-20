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
  doc: DocToSync
  payload: Payload
}) => DocToSync;

export type SearchConfig = {
  searchOverrides?: Partial<CollectionConfig>
  collections?: string[]
  defaultPriorities?: {
    [collection: string]: number
  }
  beforeSync?: BeforeSync
  syncOnlyPublished?: boolean
  deleteDrafts?: boolean
}

// TODO: extend this hook with additional args
// searchConfig: SearchConfig
// collection: string
export type SyncWithSearch = CollectionAfterChangeHook;
