import React from 'react'

type Args<T = unknown> = {
  path: string
  value?: T
}
export type DescriptionFunction<T = unknown> = (args: Args<T>) => string

export type DescriptionComponent<T = unknown> = React.ComponentType<Args<T>>

export type Description =
  | DescriptionComponent
  | DescriptionFunction
  | Record<string, string>
  | string

export type Props = {
  className?: string
  description?: Description
  marginPlacement?: 'bottom' | 'top'
  path?: string
  value?: unknown
}

export function isComponent(description: Description): description is DescriptionComponent {
  return React.isValidElement(description)
}
