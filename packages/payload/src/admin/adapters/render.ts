import type React from 'react'

import type { ImportMap, PayloadComponent } from '../../index.js'

/**
 * Pluggable component renderer.
 * RSC-capable frameworks use the current RenderServerComponent logic.
 * Non-RSC frameworks treat all components as client components.
 */
export type ComponentRenderer = (args: {
  readonly clientProps?: object
  readonly Component?:
    | PayloadComponent
    | PayloadComponent[]
    | React.ComponentType
    | React.ComponentType[]
  readonly Fallback?: React.ComponentType
  readonly importMap: ImportMap
  readonly key?: string
  readonly serverProps?: object
}) => React.ReactNode
