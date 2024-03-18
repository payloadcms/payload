import React from 'react'

export const RenderCustomComponent: React.FC<{
  CustomComponent?: React.ComponentType<any>
  DefaultComponent: React.ComponentType<any>
  fieldComponentProps?: Record<string, any>
}> = (props) => {
  const { CustomComponent, DefaultComponent, fieldComponentProps = {} } = props

  if (CustomComponent) {
    return <CustomComponent {...fieldComponentProps} />
  }

  if (DefaultComponent) {
    return <DefaultComponent {...fieldComponentProps} />
  }

  return null
}
