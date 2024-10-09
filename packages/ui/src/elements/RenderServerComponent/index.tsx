import { type ImportMap, isPlainObject, type PayloadComponent } from 'payload'
import { isReactServerComponentOrFunction, parsePayloadComponent } from 'payload/shared'
import React from 'react'

const getComponent = (args: {
  importMap: ImportMap
  PayloadComponent: PayloadComponent
  schemaPath?: string
  silent?: boolean
}): React.ComponentType => {
  const { importMap, PayloadComponent, schemaPath, silent } = args

  const { exportName, path } = parsePayloadComponent(PayloadComponent)

  const key = path + '#' + exportName

  const Component = importMap[key]

  if (!Component && !silent) {
    // eslint-disable-next-line no-console
    console.error(
      `getComponent: PayloadComponent not found in importMap`,
      {
        key,
        PayloadComponent,
        schemaPath,
      },
      'You may need to run the `payload generate:importmap` command to generate the importMap ahead of runtime.',
    )
  }

  return Component
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
    return (
      <Component
        {...clientProps}
        {...(isReactServerComponentOrFunction(Component) ? serverProps : {})}
      />
    )
  }

  if (typeof Component === 'string' || isPlainObject(Component)) {
    const ResolvedComponent = getComponent({
      importMap,
      PayloadComponent: Component,
      schemaPath: '',
    })

    if (ResolvedComponent) {
      return (
        <ResolvedComponent
          {...clientProps}
          {...(isReactServerComponentOrFunction(ResolvedComponent) ? serverProps : {})}
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
