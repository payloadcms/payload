import type { CollectionPermission, GlobalPermission } from '../../auth/index.js'
import type { FlattenedField } from '../../fields/config/types.js'

// TODO: Rename to EntityPermissions in 4.0
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
  field: FlattenedField
  fields?: FlattenedField[]
  globalSlug?: string
  invalid?: boolean
  /**
   * @todo make required in v4.0
   */
  parentIsLocalized: boolean
  path: string
}
