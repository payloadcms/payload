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

type PointFieldClientWithoutType = MarkOptional<PointFieldClient, 'type'>

export type PointFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<PointFieldClientWithoutType>
  readonly errorProps?: ErrorProps<PointFieldClientWithoutType>
  readonly field: PointFieldClientWithoutType
  readonly labelProps?: LabelProps<PointFieldClientWithoutType>
  readonly validate?: PointFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type PointFieldLabelComponent = LabelComponent<PointFieldClientWithoutType>

export type PointFieldDescriptionComponent = DescriptionComponent<PointFieldClientWithoutType>

export type PointFieldErrorComponent = ErrorComponent<PointFieldClientWithoutType>
