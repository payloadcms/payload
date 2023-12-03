import React from 'react'

export type DescriptionFunction = (value?: unknown, path?: string) => string

export type DescriptionComponent = React.ComponentType<{ path: string; value: unknown }>

export type Description =
  | DescriptionComponent
  | DescriptionFunction
  | Record<string, string>
  | string

export type Props = {
  className?: string
  description?: Description
  value?: unknown
  path?: string
  marginPlacement?: 'top' | 'bottom'
}

export function isComponent(description: Description): description is DescriptionComponent {
  return React.isValidElement(description)
}
