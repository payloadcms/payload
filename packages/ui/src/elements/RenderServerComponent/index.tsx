import type { PayloadComponent } from 'payload'

import { isPlainObject, isReactServerComponentOrFunction } from 'payload/shared'
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
  key,
  serverProps,
}) => {
  if (Array.isArray(Component)) {
    return Component.map((c, index) =>
      RenderServerComponent({
        clientProps,
        Component: c,
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

    return <Component key={key} {...sanitizedProps} />
  }

  if (typeof Component === 'string' || isPlainObject(Component)) {
    // String-based component resolution is no longer supported
    return Fallback
      ? RenderServerComponent({
          clientProps,
          Component: Fallback,
          key,
          serverProps,
        })
      : null
  }

  return Fallback
    ? RenderServerComponent({
        clientProps,
        Component: Fallback,
        key,
        serverProps,
      })
    : null
}
