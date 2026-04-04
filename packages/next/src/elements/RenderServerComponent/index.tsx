import type { ComponentRenderer } from 'payload'

import { getFromImportMap, isPlainObject, isReactServerComponentOrFunction } from 'payload/shared'
import React from 'react'

function removeUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T
}

/**
 * RSC-capable component renderer for Next.js.
 * Renders both server and client components, passing serverProps
 * only to actual server components (determined via $$typeof check).
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
        key: index,
        serverProps,
      }),
    )
  }

  if (typeof Component === 'function') {
    const isRSC = isReactServerComponentOrFunction(Component)

    const sanitizedProps = removeUndefined({
      ...clientProps,
      ...(isRSC ? serverProps : {}),
    })

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
