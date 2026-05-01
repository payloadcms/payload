import type { ComponentRenderer, PayloadComponent } from 'payload'

import { getFromImportMap, isPlainObject, isReactServerComponentOrFunction } from 'payload/shared'
import React from 'react'

function removeUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T
}

/**
 * RSC-aware component renderer for TanStack Start.
 *
 * Uses `isReactServerComponentOrFunction` to detect server components
 * and passes `serverProps` to them (same behavior as the Next.js adapter).
 *
 * This renderer runs on the server during `getAdminPageData` where the
 * TanStack Start server environment supports rendering server components.
 * The rendered output is serialized as part of the page data and sent to
 * the client via TanStack Router's loader mechanism.
 */
export const RenderRSCComponent: ComponentRenderer = ({
  clientProps = {},
  Component,
  Fallback,
  importMap,
  key,
  serverProps,
}) => {
  if (Array.isArray(Component)) {
    return Component.map((c, index) =>
      RenderRSCComponent({
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
    ? RenderRSCComponent({
        clientProps,
        Component: Fallback,
        importMap,
        key,
        serverProps,
      })
    : null
}

/**
 * Returns the RSC-aware component renderer that passes serverProps
 * to server components.
 */
export function getRSCComponentRenderer(): ComponentRenderer {
  return RenderRSCComponent
}
