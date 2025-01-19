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
  readonly importMap: ImportMap
  readonly key?: string
  /**
   * Allows you to take control of the rendering of the component. This is useful for
   * rendering an HOC.
   *
   * Return false to continue with the default rendering behaviour.
   */
  overrideRender?: (args: {
    Component: React.ComponentType
    isRSC: boolean
    key?: string
    sanitizedProps: object
  }) => false | React.ReactNode
  readonly serverProps?: object
}) => React.ReactNode

/**
 * Can be used to render both MappedComponents and React Components.
 */
export const RenderServerComponent: RenderServerComponentFn = ({
  clientProps = {},
  Component,
  Fallback,
  importMap,
  key,
  overrideRender,
  serverProps,
}) => {
  if (Array.isArray(Component)) {
    return Component.map((c, index) =>
      RenderServerComponent({
        clientProps,
        Component: c,
        importMap,
        key: index,
        overrideRender,
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

    if (overrideRender) {
      const Override = overrideRender({ Component, isRSC, key, sanitizedProps })
      if (Override !== false) {
        return Override
      }
    }

    return <Component key={key} {...sanitizedProps} />
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

      if (overrideRender) {
        const Override = overrideRender({
          Component: ResolvedComponent,
          isRSC,
          key,
          sanitizedProps,
        })
        if (Override !== false) {
          return Override
        }
      }

      return <ResolvedComponent key={key} {...sanitizedProps} />
    }
  }

  return Fallback
    ? RenderServerComponent({
        clientProps,
        Component: Fallback,
        importMap,
        key,
        overrideRender,
        serverProps,
      })
    : null
}
