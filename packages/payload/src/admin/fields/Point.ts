import type { MarkOptional } from 'ts-essentials'

import type { PointFieldClient } from '../../fields/config/types.js'
import type { PointFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

export type PointFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<PointFieldProps>
  readonly errorProps?: ErrorProps<PointFieldProps>
  readonly field: MarkOptional<PointFieldClient, 'type'>
  readonly labelProps?: LabelProps<PointFieldProps>
  readonly validate?: PointFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type PointFieldLabelComponent = LabelComponent<PointFieldProps>

export type PointFieldDescriptionComponent = DescriptionComponent<PointFieldProps>

export type PointFieldErrorComponent = ErrorComponent<PointFieldProps>
