import type { ImportMap, PayloadComponent } from 'payload'

import { getFromImportMap, isPlainObject, isReactServerComponentOrFunction } from 'payload/shared'
import React from 'react'

import { removeUndefined } from '../../utilities/removeUndefined.js'

type RenderServerComponentFn = (args: {
  readonly clientProps?: object
  readonly Component?:
    | PayloadComponent
    | PayloadComponent[]
    | React.ComponentType
    | React.ComponentType[]
  readonly Fallback?: React.ComponentType
  readonly HOC?: (Component: React.ComponentType) => React.ComponentType
  readonly importMap: ImportMap
  readonly key?: string
  readonly serverProps?: object
}) => React.ReactNode

/**
 * Can be used to render both MappedComponents and React Components.
 */
export const RenderServerComponent: RenderServerComponentFn = ({
  clientProps = {},
  Component,
  Fallback,
  HOC,
  importMap,
  key,
  serverProps,
}) => {
  if (Array.isArray(Component)) {
    return Component.map((c, index) =>
      RenderServerComponent({
        clientProps,
        Component: c,
        importMap,
        key: index,
        serverProps,
      }),
    )
  }

  if (typeof Component === 'function') {
    const isRSC = isReactServerComponentOrFunction(Component)

    // prevent $undefined from being passed through the rsc requests
    const sanitizedProps = removeUndefined({
      ...clientProps,
      ...(isRSC ? serverProps : {}),
    })

    let ComponentToRender = Component

    if (HOC) {
      ComponentToRender = HOC(Component)
    }

    return <ComponentToRender key={key} {...sanitizedProps} />
  }

  if (typeof Component === 'string' || isPlainObject(Component)) {
    const ResolvedComponent = getFromImportMap<React.ComponentType>({
      importMap,
      PayloadComponent: Component,
      schemaPath: '',
    })

    if (ResolvedComponent) {
      const isRSC = isReactServerComponentOrFunction(ResolvedComponent)

      // prevent $undefined from being passed through rsc requests
      const sanitizedProps = removeUndefined({
        ...clientProps,
        ...(isRSC ? serverProps : {}),
        ...(isRSC && typeof Component === 'object' && Component?.serverProps
          ? Component.serverProps
          : {}),
        ...(typeof Component === 'object' && Component?.clientProps ? Component.clientProps : {}),
      })

      let ComponentToRender = ResolvedComponent

      if (HOC) {
        ComponentToRender = HOC(ResolvedComponent)
      }

      return <ComponentToRender key={key} {...sanitizedProps} />
    }
  }

  return Fallback
    ? RenderServerComponent({
        clientProps,
        Component: Fallback,
        importMap,
        key,
        serverProps,
      })
    : null
}
