import type { CollectionPermission, GlobalPermission } from '../../auth/index.d.ts'
import type { Field, FieldAffectingData, TabAsField, UIField } from '../../fields/config/types.d.ts'

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
  field: Field | TabAsField
  fields?: (FieldAffectingData | TabAsField | UIField)[]
  globalSlug?: string
  invalid?: boolean
  path: string
}
