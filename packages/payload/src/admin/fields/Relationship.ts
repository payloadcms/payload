import type { MarkOptional } from 'ts-essentials'

import type { RelationshipFieldClient } from '../../fields/config/types.js'
import type { RelationshipFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

export type RelationshipFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<RelationshipFieldProps>
  readonly errorProps?: ErrorProps<RelationshipFieldProps>
  readonly field: MarkOptional<RelationshipFieldClient, 'type'>
  readonly labelProps?: LabelProps<RelationshipFieldProps>
  readonly validate?: RelationshipFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type RelationshipFieldLabelComponent = LabelComponent<RelationshipFieldProps>

export type RelationshipFieldDescriptionComponent = DescriptionComponent<RelationshipFieldProps>

export type RelationshipFieldErrorComponent = ErrorComponent<RelationshipFieldProps>
