import type { Payload } from 'payload'

import { WithServerSideProps } from '@payloadcms/ui/elements/WithServerSideProps'
import React from 'react'

export type RenderCustomComponentProps = {
  CustomComponent?: React.ComponentType<any>
  DefaultComponent: React.ComponentType<any>
  componentProps?: Record<string, any>
  /**
   * Payload automatically gets added to the component if it's an RSC
   */
  payload?: Payload
}

export const RenderCustomComponent: React.FC<RenderCustomComponentProps> = (props) => {
  const { CustomComponent, DefaultComponent, componentProps = {} } = props

  if (CustomComponent) {
    return <WithServerSideProps Component={CustomComponent} payload={null} {...componentProps} />
  }

  if (DefaultComponent) {
    return <WithServerSideProps Component={DefaultComponent} payload={null} {...componentProps} />
  }

  return null
}
