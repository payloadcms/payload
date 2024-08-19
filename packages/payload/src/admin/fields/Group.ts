import type { MarkOptional } from 'ts-essentials'

import type { GroupFieldClient } from '../../fields/config/types.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type GroupFieldClientWithoutType = MarkOptional<GroupFieldClient, 'type'>

export type GroupFieldProps = FormFieldBase<GroupFieldClientWithoutType>

export type GroupFieldLabelComponent = LabelComponent<GroupFieldClientWithoutType>

export type GroupFieldDescriptionComponent = DescriptionComponent<GroupFieldClientWithoutType>

export type GroupFieldErrorComponent = ErrorComponent<GroupFieldClientWithoutType>
