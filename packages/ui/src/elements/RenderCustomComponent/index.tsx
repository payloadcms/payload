import React from 'react'

export const RenderCustomComponent: React.FC<{
  CustomComponent?: React.ComponentType<any>
  DefaultComponent: React.ComponentType<any>
  componentProps: any
}> = (props) => {
  const { CustomComponent, DefaultComponent, componentProps } = props

  if (CustomComponent) {
    return <CustomComponent {...componentProps} />
  }

  return <DefaultComponent {...componentProps} />
}
