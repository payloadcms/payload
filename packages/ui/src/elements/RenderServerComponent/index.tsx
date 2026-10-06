import type { ImportMap, PayloadComponent } from 'payload'

import {
  getFromImportMap,
  isPlainObject,
  isReactServerComponentOrFunction,
  parsePayloadComponent,
} from 'payload/shared'
import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Preserve the client boundary during RSC rendering
import { ConfigComponentErrorBoundary } from '../../exports/client/index.js'
import { removeUndefined } from '../../utilities/removeUndefined.js'
import { getComponentInstanceKey } from './getComponentInstanceKey.js'

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

    // prevent $undefined from being passed through the rsc requests
    const sanitizedProps = removeUndefined({
      ...clientProps,
      ...(isRSC ? serverProps : {}),
    })

    return (
      <ConfigComponentErrorBoundary
        componentName={
          isRSC ? Component.name || 'configured server component' : 'configured client component'
        }
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
    ...(isReactServerComponentOrFunction(Fallback) ? serverProps : {}),
  })

  return <Fallback key={key} {...sanitizedProps} />
}
