import type { ImportMap, PayloadComponent } from 'payload'

import { getFromImportMap, isPlainObject, isReactServerComponentOrFunction } from 'payload/shared'
import React from 'react'

import { removeUndefined } from '../../utilities/removeUndefined.js'
import { RenderClientComponentWithHOC } from './RenderClientComponent.js'

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
      if (isReactServerComponentOrFunction(HOC)) {
        ComponentToRender = HOC(Component)
      } else {
        return (
          <RenderClientComponentWithHOC
            Component={Component}
            HOC={HOC}
            key={key}
            props={sanitizedProps}
          />
        )
      }
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
        /**
         *  if HOC is a client, component must also be a client
         * if HOC is a server, component can be either
         */
        const HOCisRSC = isReactServerComponentOrFunction(HOC)
        if (HOCisRSC) {
          ComponentToRender = HOC(ResolvedComponent)
        } else if (!HOCisRSC && !isRSC) {
          return (
            <RenderClientComponentWithHOC
              Component={ResolvedComponent}
              HOC={HOC}
              key={key}
              props={sanitizedProps}
            />
          )
        } else {
          console.warn(
            'RenderServerComponent: HOC is a client component but Component is a server component. This is not allowed.',
          )
        }
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
