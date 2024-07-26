import type { RelationshipField } from '../../fields/config/types.js'
import type { FormFieldBase } from '../types.js'

export type RelationshipFieldProps = {
  allowCreate?: RelationshipField['admin']['allowCreate']
  hasMany?: boolean
  isSortable?: boolean
  name: string
  relationTo?: RelationshipField['relationTo']
  sortOptions?: RelationshipField['admin']['sortOptions']
  type?: 'relationship'
  width?: string
} & FormFieldBase
