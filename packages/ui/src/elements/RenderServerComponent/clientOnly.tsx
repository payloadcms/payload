import type { ComponentRenderer } from 'payload'

import { getFromImportMap, isPlainObject, parsePayloadComponent } from 'payload/shared'
import React from 'react'

import { removeUndefined } from '../../utilities/removeUndefined.js'
import { ConfigComponentErrorBoundary } from '../ConfigComponentErrorBoundary/index.js'
import { getComponentInstanceKey } from './getComponentInstanceKey.js'

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
        key: String(index),
      }),
    )
  }

  if (typeof Component === 'function') {
    const sanitizedProps = removeUndefined({ ...clientProps })
    return (
      <ConfigComponentErrorBoundary
        componentName={Component.displayName || Component.name || 'configured component'}
        instanceKey={getComponentInstanceKey({ key, props: sanitizedProps })}
        key={key}
      >
        <Component {...sanitizedProps} />
      </ConfigComponentErrorBoundary>
    )
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

      const { exportName, path } = parsePayloadComponent(Component)

      return (
        <ConfigComponentErrorBoundary
          componentName={`${path}#${exportName}`}
          instanceKey={getComponentInstanceKey({ key, props: sanitizedProps })}
          key={key}
        >
          <ResolvedComponent {...sanitizedProps} />
        </ConfigComponentErrorBoundary>
      )
    }
  }

  if (!Fallback) {
    return null
  }

  const sanitizedProps = removeUndefined({
    ...clientProps,
  })

  return <Fallback key={key} {...sanitizedProps} />
}
