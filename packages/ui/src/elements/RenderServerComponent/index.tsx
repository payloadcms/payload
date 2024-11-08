import type { ImportMap, PayloadComponent } from 'payload'

import {
  isPlainObject,
  isReactServerComponentOrFunction,
  parsePayloadComponent,
} from 'payload/shared'
import React from 'react'

export const getFromImportMap = <TOutput,>(args: {
  importMap: ImportMap
  PayloadComponent: PayloadComponent
  schemaPath?: string
  silent?: boolean
}): TOutput => {
  const { importMap, PayloadComponent, schemaPath, silent } = args

  const { exportName, path } = parsePayloadComponent(PayloadComponent)

  const key = path + '#' + exportName

  const importMapEntry = importMap[key]

  if (!importMapEntry && !silent) {
    // eslint-disable-next-line no-console
    console.error(
      `getFromImportMap: PayloadComponent not found in importMap`,
      {
        key,
        PayloadComponent,
        schemaPath,
      },
      'You may need to run the `payload generate:importmap` command to generate the importMap ahead of runtime.',
    )
  }

  return importMapEntry
}

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
