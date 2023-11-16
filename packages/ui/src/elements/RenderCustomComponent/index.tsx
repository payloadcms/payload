import React from 'react'

import type { Props } from './types'

export const RenderCustomComponent: React.FC<Props> = (props) => {
  const { CustomComponent, DefaultComponent, componentProps } = props

  if (CustomComponent) {
    return <CustomComponent {...componentProps} />
  }

  return <DefaultComponent {...componentProps} />
}
