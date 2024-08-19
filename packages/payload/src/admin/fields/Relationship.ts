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

type RelationshipFieldClientWithoutType = MarkOptional<RelationshipFieldClient, 'type'>

export type RelationshipFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<RelationshipFieldClientWithoutType>
  readonly errorProps?: ErrorProps<RelationshipFieldClientWithoutType>
  readonly field: RelationshipFieldClientWithoutType
  readonly labelProps?: LabelProps<RelationshipFieldClientWithoutType>
  readonly validate?: RelationshipFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type RelationshipFieldLabelComponent = LabelComponent<RelationshipFieldClientWithoutType>

export type RelationshipFieldDescriptionComponent =
  DescriptionComponent<RelationshipFieldClientWithoutType>

export type RelationshipFieldErrorComponent = ErrorComponent<RelationshipFieldClientWithoutType>
