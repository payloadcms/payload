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
    props: {
      clientProps: JsonObject
      serverProps: object
    },
    Fallback: React.FC<any>,
    identifier: string,
  ): MappedComponent => {
    const { clientProps, serverProps: componentServerProps } = props || {}

    if (payloadComponent === undefined || payloadComponent === null) {
      if (!Fallback) {
        return undefined
      }

      if (isReactServerComponentOrFunction(Fallback)) {
        return {
          type: 'server',
          Component: null,
          RenderedComponent: (
            <Fallback key={key} {...serverProps} {...componentServerProps} {...clientProps} />
          ),
        }
      } else {
        const toReturn: MappedComponent = {
          type: 'client',
          Component: Fallback,
        }

        // conditionally set props here to avoid bloating the HTML with `$undefined` props
        if (clientProps) {
          toReturn.props = clientProps
        }

        return toReturn
      }
    }

    if (payloadComponent === false) {
      return {
        type: 'empty',
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
            identifier,
            importMap,
            payloadComponent: payloadComponent as any,
          })

    if (!resolvedComponent.Component) {
      console.error(`getCreateMappedComponent: Component not found in importMap`, {
        identifier,
        key,
      })
    }

    if (isReactServerComponentOrFunction(resolvedComponent.Component)) {
      const Component: React.FC<any> = resolvedComponent.Component

      return {
        type: 'server',
        Component: null,
        RenderedComponent: (
          <Component
            key={key}
            {...serverProps}
            {...resolvedComponent.serverProps}
            {...componentServerProps}
            {...clientProps}
          />
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
          ...clientProps,
        },
      }
    }
  }

  const createMappedComponent: CreateMappedComponent = (
    payloadComponent,
    props,
    fallback,
    identifier,
  ) => {
    if ((payloadComponent === undefined || payloadComponent === null) && !fallback) {
      return undefined as any
    }

    if (payloadComponent && Array.isArray(payloadComponent)) {
      const mappedComponents: MappedComponent[] = []
      for (let i = 0; i < payloadComponent.length; i++) {
        const component = createSingleMappedComponent(
          payloadComponent[i],
          i,
          props,
          fallback,
          identifier,
        )
        mappedComponents.push(component)
      }
      return mappedComponents as any
    } else {
      return createSingleMappedComponent(
        payloadComponent,
        undefined,
        props,
        fallback,
        identifier,
      ) as any
    }
  }

  return createMappedComponent
}
