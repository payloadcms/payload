import type { MarkOptional } from 'ts-essentials'

import type { RelationshipFieldClient } from '../../fields/config/types.js'
import type { RelationshipFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type RelationshipFieldProps = {
  readonly field: MarkOptional<RelationshipFieldClient, 'type'>
  readonly validate?: RelationshipFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type RelationshipFieldLabelComponent = LabelComponent<'relationship'>

export type RelationshipFieldDescriptionComponent = DescriptionComponent<'relationship'>

export type RelationshipFieldErrorComponent = ErrorComponent<'relationship'>
