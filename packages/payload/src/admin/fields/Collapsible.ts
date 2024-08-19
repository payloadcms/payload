import type { MarkOptional } from 'ts-essentials'

import type { CollapsibleFieldClient } from '../../fields/config/types.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type CollapsibleFieldClientWithoutType = MarkOptional<CollapsibleFieldClient, 'type'>

export type CollapsibleFieldProps = FormFieldBase<CollapsibleFieldClientWithoutType>

export type CollapsibleFieldLabelComponent = LabelComponent<CollapsibleFieldClientWithoutType>

export type CollapsibleFieldDescriptionComponent =
  DescriptionComponent<CollapsibleFieldClientWithoutType>

export type CollapsibleFieldErrorComponent = ErrorComponent<CollapsibleFieldClientWithoutType>
