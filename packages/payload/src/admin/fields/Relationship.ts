import type { RelationshipField } from '../../fields/config/types.js'
import type { RelationshipFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type RelationshipFieldProps = {
  allowCreate?: RelationshipField['admin']['allowCreate']
  hasMany?: boolean
  isSortable?: boolean
  name: string
  relationTo?: RelationshipField['relationTo']
  sortOptions?: RelationshipField['admin']['sortOptions']
  validate?: RelationshipFieldValidation
  width?: string
} & Omit<FormFieldBase, 'validate'>

export type RelationshipFieldLabelComponent = LabelComponent<'relationship'>

export type RelationshipFieldDescriptionComponent = DescriptionComponent<'relationship'>

export type RelationshipFieldErrorComponent = ErrorComponent<'relationship'>
