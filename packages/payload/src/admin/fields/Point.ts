import type { MarkOptional } from 'ts-essentials'

import type { PointFieldClient } from '../../fields/config/types.js'
import type { PointFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type PointFieldClientWithoutType = MarkOptional<PointFieldClient, 'type'>

export type PointFieldProps = {
  readonly validate?: PointFieldValidation
} & Omit<FormFieldBase<PointFieldClientWithoutType>, 'validate'>

export type PointFieldLabelComponent = LabelComponent<PointFieldClientWithoutType>

export type PointFieldDescriptionComponent = DescriptionComponent<PointFieldClientWithoutType>

export type PointFieldErrorComponent = ErrorComponent<PointFieldClientWithoutType>
