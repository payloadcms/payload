import type { GenericClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type RelationshipFieldProps = {
  readonly clientFieldConfig: GenericClientFieldConfig<'relationship'>
} & FormFieldBase

export type RelationshipFieldLabelComponent = LabelComponent<'relationship'>

export type RelationshipFieldDescriptionComponent = DescriptionComponent<'relationship'>

export type RelationshipFieldErrorComponent = ErrorComponent<'relationship'>
