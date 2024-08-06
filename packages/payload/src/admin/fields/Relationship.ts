import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { RelationshipFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type RelationshipFieldClient = {
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'relationship' }>

export type RelationshipFieldProps = {
  readonly field: RelationshipFieldClient
  readonly validate?: RelationshipFieldValidation
} & FormFieldBase

export type RelationshipFieldLabelComponent = LabelComponent<'relationship'>

export type RelationshipFieldDescriptionComponent = DescriptionComponent<'relationship'>

export type RelationshipFieldErrorComponent = ErrorComponent<'relationship'>
