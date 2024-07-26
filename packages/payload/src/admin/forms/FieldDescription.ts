import type { CustomComponent, LabelFunction } from '../../config/types.js'
import type { MappedComponent, Payload } from '../../index.js'

export type DescriptionFunction = LabelFunction

export type DescriptionComponent = CustomComponent<FieldDescriptionProps>

export type Description = DescriptionFunction | Record<string, string> | string

export type FieldDescriptionProps = {
  CustomDescription?: MappedComponent
  className?: string
  description?: Record<string, string> | string
  marginPlacement?: 'bottom' | 'top'
  payload?: Payload
}
