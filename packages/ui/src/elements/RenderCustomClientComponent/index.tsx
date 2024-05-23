import React from 'react'

export type RenderCustomComponentProps = {
  CustomComponent?: React.ComponentType<any>
  DefaultComponent: React.ComponentType<any>
  componentProps?: Record<string, any>
}

export const RenderCustomClientComponent: React.FC<RenderCustomComponentProps> = (props) => {
  const { CustomComponent, DefaultComponent, componentProps = {} } = props

  if (CustomComponent) {
    return <CustomComponent {...componentProps} />
  }

  if (DefaultComponent) {
    return <DefaultComponent {...componentProps} />
  }

  return null
}
