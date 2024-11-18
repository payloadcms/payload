import type { CollectionPermission, GlobalPermission } from '../../auth/index.js'
import type { FlattenField } from '../../fields/config/types.js'

export type EntityPolicies = {
  collections?: {
    [collectionSlug: string]: CollectionPermission
  }
  globals?: {
    [globalSlug: string]: GlobalPermission
  }
}

export type PathToQuery = {
  collectionSlug?: string
  complete: boolean
  field: FlattenField
  fields?: FlattenField[]
  globalSlug?: string
  invalid?: boolean
  path: string
}
