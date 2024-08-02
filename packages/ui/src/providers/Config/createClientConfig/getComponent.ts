import type { ImportMap, PayloadComponent, ResolvedComponent } from 'payload'

import { parsePayloadComponent } from 'payload/shared'

/**
 * Gets th resolved React component from `PayloadComponent` from the importMap
 */
export const getComponent = <
  TComponentServerProps extends object,
  TComponentClientProps extends object,
>({
  importMap,
  payloadComponent,
}: {
  importMap: ImportMap
  payloadComponent:
    | PayloadComponent<TComponentServerProps, TComponentClientProps>
    | null
    | undefined
}): ResolvedComponent<TComponentServerProps, TComponentClientProps> => {
  if (!payloadComponent) {
    return {
      Component: undefined,
      clientProps: undefined,
      serverProps: undefined,
    }
  }
  const { exportName, path } = parsePayloadComponent(payloadComponent)
  const key = path + '#' + exportName

  const Component = importMap[key]
  if (!Component) {
    console.error(`Component not found in importMap: ${key}`)
  }

  return {
    Component,
    clientProps:
      typeof payloadComponent === 'object'
        ? (payloadComponent.clientProps as TComponentClientProps)
        : undefined,
    serverProps:
      typeof payloadComponent === 'object'
        ? (payloadComponent.serverProps as TComponentServerProps)
        : undefined,
  }
}
