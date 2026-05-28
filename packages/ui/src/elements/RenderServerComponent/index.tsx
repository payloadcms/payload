import type { ComponentRenderer, PayloadComponent } from 'payload'

import { getFromImportMap, isPlainObject, isReactServerComponentOrFunction } from 'payload/shared'
import React from 'react'

import { removeUndefined } from '../../utilities/removeUndefined.js'

/**
 * RSC-aware component renderer shared by every framework adapter.
 *
 * Uses `isReactServerComponentOrFunction` to detect server components and
 * passes `serverProps` to them. Client components only receive `clientProps`.
 *
 * Works under any framework whose runtime supports rendering React Server
 * Components (Next.js's app router, TanStack Start with the Vite RSC plugin,
 * etc.). The rendered output is a normal React tree that can either be
 * embedded inline (Next.js RSC route) or streamed via
 * `@tanstack/react-start/rsc`'s `renderServerComponent` / `renderToReadableStream`.
 */
export const RenderServerComponent: ComponentRenderer = ({
  clientProps = {},
  Component,
  Fallback,
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
        key: String(index),
        serverProps,
      }),
    )
  }

  if (typeof Component === 'function') {
    const isRSC = isReactServerComponentOrFunction(Component)

    // prevent $undefined from being passed through RSC requests
    const sanitizedProps = removeUndefined({
      ...clientProps,
      ...(isRSC ? serverProps : {}),
    })

    return <Component key={key} {...sanitizedProps} />
  }

  if (typeof Component === 'string' || isPlainObject(Component)) {
    const ResolvedComponent = getFromImportMap<React.ComponentType>({
      importMap,
      PayloadComponent: Component as PayloadComponent,
      schemaPath: '',
    })

    if (ResolvedComponent) {
      const isRSC = isReactServerComponentOrFunction(ResolvedComponent)

      // prevent $undefined from being passed through RSC requests
      const sanitizedProps = removeUndefined({
        ...clientProps,
        ...(isRSC ? serverProps : {}),
        ...(isRSC && typeof Component === 'object' && Component?.serverProps
          ? Component.serverProps
          : {}),
        ...(typeof Component === 'object' && Component?.clientProps ? Component.clientProps : {}),
      })

      return <ResolvedComponent key={key} {...sanitizedProps} />
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

/**
 * Returns the RSC-aware component renderer that passes `serverProps`
 * to server components. Kept for adapter back-compat — prefer importing
 * `RenderServerComponent` directly.
 */
export function getRSCComponentRenderer(): ComponentRenderer {
  return RenderServerComponent
}
