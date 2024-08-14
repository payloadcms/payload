import type { MarkOptional } from 'ts-essentials'

import type { CodeFieldClient } from '../../fields/config/types.js'
import type { CodeFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type CodeFieldProps = {
  readonly autoComplete?: string
  readonly field: MarkOptional<CodeFieldClient, 'type'>
  readonly validate?: CodeFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type CodeFieldLabelComponent = LabelComponent<'code'>

export type CodeFieldDescriptionComponent = DescriptionComponent<'code'>

export type CodeFieldErrorComponent = ErrorComponent<'code'>
