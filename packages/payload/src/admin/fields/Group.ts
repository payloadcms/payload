import type { MarkOptional } from 'ts-essentials'

import type { GroupFieldClient } from '../../fields/config/types.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type GroupFieldProps = {
  readonly field: MarkOptional<GroupFieldClient, 'type'>
} & FormFieldBase

export type GroupFieldLabelComponent = LabelComponent<'group'>

export type GroupFieldDescriptionComponent = DescriptionComponent<'group'>

export type GroupFieldErrorComponent = ErrorComponent<'group'>
