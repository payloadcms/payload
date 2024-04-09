import type React from 'react'

import type { LabelFunction } from '../../config/types.js'

export type DescriptionFunction = LabelFunction

export type DescriptionComponent = React.ComponentType<FieldDescriptionProps>

export type Description =
  | DescriptionComponent
  | DescriptionFunction
  | Record<string, string>
  | string

export type FieldDescriptionProps = {
  CustomDescription?: React.ReactNode
  className?: string
  description?: Record<string, string> | string
  marginPlacement?: 'bottom' | 'top'
}
