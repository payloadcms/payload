import type { I18nClient } from '@payloadcms/translations'
import type {
  CreateMappedComponent,
  ImportMap,
  JsonObject,
  MappedComponent,
  Payload,
  PayloadComponent,
} from 'payload'

import { isReactServerComponentOrFunction } from 'payload/shared'
import React from 'react'

import { getComponent } from './getComponent.js'

export function getCreateMappedComponent({
  importMap,
  serverProps,
}: {
  importMap: ImportMap
  serverProps: {
    [key: string]: any
    i18n?: I18nClient
    payload?: Payload
  }
}): CreateMappedComponent {
  const createSingleMappedComponent = (
    payloadComponent: { ReactComponent: React.FC<any> } | PayloadComponent,
    key: number | string,
    props?: JsonObject,
    Fallback?: React.FC<any>,
  ): MappedComponent => {
    if (!payloadComponent) {
      if (!Fallback) {
        return undefined
      }
      if (isReactServerComponentOrFunction(Fallback)) {
        return {
          type: 'server',
          Component: null,
          RenderedComponent: <Fallback key={key} {...serverProps} {...props} />,
        }
      } else {
        return {
          type: 'client',
          Component: Fallback,
          props,
        }
      }
    }
    const resolvedComponent =
      payloadComponent &&
      typeof payloadComponent === 'object' &&
      'ReactComponent' in payloadComponent
        ? {
            Component: payloadComponent.ReactComponent,
          }
        : getComponent({
            importMap,
            payloadComponent: payloadComponent as any,
          })

    if (!resolvedComponent.Component) {
      console.error(`Component not found in importMap: ${key}`)
    }

    if (isReactServerComponentOrFunction(resolvedComponent.Component)) {
      const Component: React.FC<any> = resolvedComponent.Component
      return {
        type: 'server',
        Component: null,
        RenderedComponent: (
          <Component key={key} {...serverProps} {...resolvedComponent.serverProps} {...props} />
        ),
      }
    } else {
      if (!resolvedComponent.Component) {
        return undefined
      }
      return {
        type: 'client',
        Component: resolvedComponent.Component,
        props: {
          ...(resolvedComponent.clientProps || {}),
          ...props,
        },
      }
    }
  }

  const createMappedComponent: CreateMappedComponent = (payloadComponent, props, fallback) => {
    if (!payloadComponent && !fallback) {
      return undefined as any
    }
    if (payloadComponent && Array.isArray(payloadComponent)) {
      const mappedComponents: MappedComponent[] = []
      for (let i = 0; i < payloadComponent.length; i++) {
        const component = createSingleMappedComponent(payloadComponent[i], i, props, fallback)
        mappedComponents.push(component)
      }
      return mappedComponents as any
    } else {
      return createSingleMappedComponent(payloadComponent, undefined, props, fallback) as any
    }
  }

  return createMappedComponent
}
