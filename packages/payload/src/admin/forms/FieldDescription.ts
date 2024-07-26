import type React from 'react'

import type { CustomComponent, LabelFunction, ServerProps } from '../../config/types.js'
import type { FieldComponentProps } from '../types.js'
import type { FieldTypes } from './FieldTypes.js'

export type DescriptionFunction = LabelFunction

export type DescriptionComponent<T extends keyof FieldTypes = any> = CustomComponent<
  FieldDescriptionProps<T>
>

export type Description = DescriptionFunction | Record<string, string> | string

export type FieldDescriptionProps<T extends keyof FieldTypes = any> = {
  CustomDescription?: React.ReactNode
  className?: string
  description?: Record<string, string> | string
  marginPlacement?: 'bottom' | 'top'
  type: T
} & FieldComponentProps &
  Partial<ServerProps>
