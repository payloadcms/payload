import type React from 'react'

import type { CustomComponent, LabelFunction, ServerProps } from '../../config/types.js'
import type { FormFieldBase } from './Field.js'

export type DescriptionFunction = LabelFunction

export type DescriptionComponent = CustomComponent<FieldDescriptionProps>

export type Description = DescriptionFunction | Record<string, string> | string

export type FieldDescriptionProps = {
  CustomDescription?: React.ReactNode
  className?: string
  description?: Record<string, string> | string
  marginPlacement?: 'bottom' | 'top'
} & FormFieldBase &
  Partial<ServerProps>
