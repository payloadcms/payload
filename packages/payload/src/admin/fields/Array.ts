import type { MarkOptional } from 'ts-essentials'

import type { ArrayFieldClient } from '../../fields/config/types.js'
import type { ArrayFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FormFieldBase,
  LabelComponent,
  MappedComponent,
} from '../types.js'

export type ArrayFieldProps = {
  readonly CustomRowLabel?: MappedComponent
  readonly field: MarkOptional<ArrayFieldClient, 'type'>
  readonly validate?: ArrayFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type ArrayFieldLabelComponent = LabelComponent<'array'>

export type ArrayFieldDescriptionComponent = DescriptionComponent<'array'>

export type ArrayFieldErrorComponent = ErrorComponent<'array'>
