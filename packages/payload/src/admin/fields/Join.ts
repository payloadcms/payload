import type { MarkOptional } from 'ts-essentials'

import type { JoinFieldClient } from '../../fields/config/types.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type JoinFieldProps = {
  readonly field: MarkOptional<JoinFieldClient, 'type'>
} & FormFieldBase

export type JoinFieldLabelComponent = LabelComponent<'join'>

export type JoinFieldDescriptionComponent = DescriptionComponent<'join'>

export type JoinFieldErrorComponent = ErrorComponent<'join'>
