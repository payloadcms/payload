import React from 'react'

export const RenderCustomComponent = (props) => {
  const { CustomComponent, DefaultComponent, componentProps } = props

  if (CustomComponent) {
    return <CustomComponent {...componentProps} />
  }

  return <DefaultComponent {...componentProps} />
}
