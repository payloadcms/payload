import type { MarkOptional } from 'ts-essentials'

import type { PointFieldClient } from '../../fields/config/types.js'
import type { PointFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type PointFieldProps = {
  readonly field: MarkOptional<PointFieldClient, 'type'>
  readonly validate?: PointFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type PointFieldLabelComponent = LabelComponent<'point'>

export type PointFieldDescriptionComponent = DescriptionComponent<'point'>

export type PointFieldErrorComponent = ErrorComponent<'point'>
