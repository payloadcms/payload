import type { MappedComponent } from 'payload'

import { isReactServerComponentOrFunction } from 'payload/shared'
import React from 'react'

/**
 * Can be used to render both MappedComponents and React Components.
 */
export const RenderComponent: React.FC<{
  readonly Component?: React.ComponentType | React.ComponentType[]
  readonly clientProps?: object
  readonly mappedComponent?: MappedComponent | MappedComponent[]
  readonly serverProps?: object
}> = ({ Component, clientProps = {}, mappedComponent, serverProps }) => {
  if (!mappedComponent && Component) {
    if (Array.isArray(Component)) {
      return Component.map((c, index) => (
        <RenderComponent
          Component={c}
          clientProps={clientProps}
          key={index}
          serverProps={serverProps}
        />
      ))
    }

    const mappedComponent: MappedComponent = isReactServerComponentOrFunction(Component)
      ? {
          type: 'server',
          Component,
          RenderedComponent: null,
        }
      : {
          type: 'client',
          Component,
        }

    return (
      <RenderComponent
        clientProps={clientProps}
        mappedComponent={mappedComponent}
        serverProps={serverProps}
      />
    )
  }
  if (!mappedComponent) {
    return null
  }

  if (Array.isArray(mappedComponent)) {
    return mappedComponent.map((c, index) => (
      <RenderComponent
        clientProps={clientProps}
        key={index}
        mappedComponent={c}
        serverProps={serverProps}
      />
    ))
  }

  if (mappedComponent.RenderedComponent) {
    return mappedComponent.RenderedComponent
  }

  if (!mappedComponent.Component) {
    return null
  }

  if (mappedComponent.type === 'server') {
    if (mappedComponent.props) {
      return (
        <mappedComponent.Component {...mappedComponent.props} {...serverProps} {...clientProps} />
      )
    }

    return <mappedComponent.Component {...serverProps} {...clientProps} />
  }

  if (mappedComponent.props) {
    return <mappedComponent.Component {...mappedComponent.props} {...clientProps} />
  }

  return <mappedComponent.Component {...clientProps} />
}
