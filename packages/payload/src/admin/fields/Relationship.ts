import type { MarkOptional } from 'ts-essentials'

import type { RelationshipFieldClient } from '../../fields/config/types.js'
import type { RelationshipFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type RelationshipFieldClientWithoutType = MarkOptional<RelationshipFieldClient, 'type'>

export type RelationshipFieldProps = {
  readonly validate?: RelationshipFieldValidation
} & Omit<FormFieldBase<RelationshipFieldClientWithoutType>, 'validate'>

export type RelationshipFieldLabelComponent = LabelComponent<RelationshipFieldClientWithoutType>

export type RelationshipFieldDescriptionComponent =
  DescriptionComponent<RelationshipFieldClientWithoutType>

export type RelationshipFieldErrorComponent = ErrorComponent<RelationshipFieldClientWithoutType>
