import type { MarkOptional } from 'ts-essentials'

import type { CodeFieldClient } from '../../fields/config/types.js'
import type { CodeFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type CodeFieldClientWithoutType = MarkOptional<CodeFieldClient, 'type'>

export type CodeFieldProps = {
  readonly autoComplete?: string
  readonly validate?: CodeFieldValidation
} & Omit<FormFieldBase<CodeFieldClientWithoutType>, 'validate'>

export type CodeFieldLabelComponent = LabelComponent<CodeFieldClientWithoutType>

export type CodeFieldDescriptionComponent = DescriptionComponent<CodeFieldClientWithoutType>

export type CodeFieldErrorComponent = ErrorComponent<CodeFieldClientWithoutType>
