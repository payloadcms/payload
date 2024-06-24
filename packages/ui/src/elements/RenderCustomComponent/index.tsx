import type { ServerProps } from 'payload/config'

import React from 'react'

import { WithServerSideProps } from '../WithServerSideProps/index.js'

export type RenderCustomComponentProps = {
  CustomComponent?: React.ComponentType<any>
  DefaultComponent: React.ComponentType<any>
  componentProps?: Record<string, any>
  /**
   * Server-only props automatically get added to the component if it's an RSC
   */
  serverOnlyProps?: ServerProps
}

export const RenderCustomComponent: React.FC<RenderCustomComponentProps> = (props) => {
  const { CustomComponent, DefaultComponent, componentProps, serverOnlyProps } = props

  if (CustomComponent) {
    return (
      <WithServerSideProps
        Component={CustomComponent}
        serverOnlyProps={serverOnlyProps}
        {...componentProps}
      />
    )
  }

  if (DefaultComponent) {
    return (
      <WithServerSideProps
        Component={DefaultComponent}
        serverOnlyProps={serverOnlyProps}
        {...componentProps}
      />
    )
  }

  return null
}
