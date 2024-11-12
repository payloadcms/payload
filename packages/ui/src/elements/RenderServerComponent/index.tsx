import type { ImportMap, PayloadComponent } from 'payload'

import { getFromImportMap, isPlainObject, isReactServerComponentOrFunction } from 'payload/shared'
import React from 'react'

/**
 * Can be used to render both MappedComponents and React Components.
 */
export const RenderServerComponent: React.FC<{
  readonly clientProps?: object
  readonly Component?:
    | PayloadComponent
    | PayloadComponent[]
    | React.ComponentType
    | React.ComponentType[]
  readonly Fallback?: React.ComponentType
  readonly importMap: ImportMap
  readonly serverProps?: object
}> = ({ clientProps = {}, Component, Fallback, importMap, serverProps }) => {
  if (Array.isArray(Component)) {
    return Component.map((c, index) => (
      <RenderServerComponent
        clientProps={clientProps}
        Component={c}
        importMap={importMap}
        key={index}
        serverProps={serverProps}
      />
    ))
  }

  if (typeof Component === 'function') {
    const isRSC = isReactServerComponentOrFunction(Component)

    return <Component {...clientProps} {...(isRSC ? serverProps : {})} />
  }

  if (typeof Component === 'string' || isPlainObject(Component)) {
    const ResolvedComponent = getFromImportMap<React.ComponentType>({
      importMap,
      PayloadComponent: Component,
      schemaPath: '',
    })

    if (ResolvedComponent) {
      const isRSC = isReactServerComponentOrFunction(ResolvedComponent)

      return (
        <ResolvedComponent
          {...clientProps}
          {...(isRSC ? serverProps : {})}
          {...(isRSC && typeof Component === 'object' && Component?.serverProps
            ? Component.serverProps
            : {})}
          {...(typeof Component === 'object' && Component?.clientProps
            ? Component.clientProps
            : {})}
        />
      )
    }
  }

  return Fallback ? (
    <RenderServerComponent
      clientProps={clientProps}
      Component={Fallback}
      importMap={importMap}
      serverProps={serverProps}
    />
  ) : null
}
