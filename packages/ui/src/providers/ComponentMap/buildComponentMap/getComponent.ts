import type { ComponentImportMap, PayloadComponent, ResolvedComponent } from 'payload'

import { parsePayloadComponent } from 'payload/shared'

export const getComponent = <
  TComponentServerProps extends object,
  TComponentClientProps extends object,
>({
  componentImportMap,
  payloadComponent,
}: {
  componentImportMap: ComponentImportMap
  payloadComponent:
    | PayloadComponent<TComponentServerProps, TComponentClientProps>
    | null
    | undefined
}): ResolvedComponent<TComponentServerProps, TComponentClientProps> => {
  if (!payloadComponent) {
    return {
      clientProps: undefined,
      component: undefined,
      serverProps: undefined,
    }
  }
  const { exportName, path } = parsePayloadComponent(payloadComponent)
  const key = path + '#' + exportName

  const component = componentImportMap[key]
  if (!component) {
    console.error(`Component not found in componentImportMap: ${key}`)
  }

  return {
    clientProps:
      typeof payloadComponent === 'object'
        ? (payloadComponent.clientProps as TComponentClientProps)
        : undefined,
    component,
    serverProps:
      typeof payloadComponent === 'object'
        ? (payloadComponent.serverProps as TComponentServerProps)
        : undefined,
  }
}
