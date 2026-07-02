import type { ComponentRenderer } from 'payload'

import { getFromImportMap, isPlainObject } from 'payload/shared'
import React from 'react'

import { removeUndefined } from '../../utilities/removeUndefined.js'

/**
 * Client-only component renderer for non-RSC frameworks.
 * All components are treated as client components - serverProps are never passed.
 * Use this when the framework doesn't support React Server Components.
 */
export const RenderClientComponent: ComponentRenderer = ({
  clientProps = {},
  Component,
  Fallback,
  importMap,
  key,
}) => {
  if (Array.isArray(Component)) {
    return Component.map((c, index) =>
      RenderClientComponent({
        clientProps,
        Component: c,
        importMap,
        key: index,
      }),
    )
  }

  if (typeof Component === 'function') {
    const sanitizedProps = removeUndefined({ ...clientProps })
    return <Component key={key} {...sanitizedProps} />
  }

  if (typeof Component === 'string' || isPlainObject(Component)) {
    const ResolvedComponent = getFromImportMap<React.ComponentType>({
      importMap,
      PayloadComponent: Component,
      schemaPath: '',
    })

    if (ResolvedComponent) {
      const sanitizedProps = removeUndefined({
        ...clientProps,
        ...(typeof Component === 'object' && Component?.clientProps ? Component.clientProps : {}),
      })

      return <ResolvedComponent key={key} {...sanitizedProps} />
    }
  }

  return Fallback
    ? RenderClientComponent({
        clientProps,
        Component: Fallback,
        importMap,
        key,
      })
    : null
}
