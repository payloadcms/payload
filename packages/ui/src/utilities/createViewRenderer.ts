import type { ImportMap, PayloadComponent } from 'payload'
import type React from 'react'

import { RenderServerComponent } from '../elements/RenderServerComponent/index.js'

export type ViewComponentRendererArgs = {
  readonly clientProps?: object
  readonly Component?:
    | PayloadComponent
    | PayloadComponent[]
    | React.ComponentType
    | React.ComponentType[]
  readonly Fallback?: React.ComponentType
  readonly key?: string
  readonly serverProps?: object
}

export type ViewComponentRenderer = (args: ViewComponentRendererArgs) => React.ReactNode

export type WithViewRenderer = {
  readonly viewRenderer?: ViewComponentRenderer
}

export const createViewRenderer = ({
  importMap,
}: {
  importMap: ImportMap
}): ViewComponentRenderer => {
  return ({ clientProps, Component, Fallback, key, serverProps }) =>
    RenderServerComponent({
      clientProps,
      Component,
      Fallback,
      importMap,
      key,
      serverProps,
    })
}
