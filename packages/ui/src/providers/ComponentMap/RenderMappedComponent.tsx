import type { MappedComponent } from 'payload'
import type React from 'react'

export const RenderMappedComponent: React.FC<{
  readonly clientProps?: object
  readonly component: MappedComponent | MappedComponent[]
}> = ({ clientProps = {}, component }) => {
  if (!component) {
    return null
  }

  if (Array.isArray(component)) {
    return component.map((c, index) => (
      <RenderMappedComponent clientProps={clientProps} component={c} key={index} />
    ))
  }

  if (component.type === 'server') {
    return component.Component
  }

  if (component.props) {
    return (
      component.RenderedComponent ?? <component.Component {...component.props} {...clientProps} />
    )
  }

  return component.RenderedComponent ?? <component.Component {...clientProps} />
}
