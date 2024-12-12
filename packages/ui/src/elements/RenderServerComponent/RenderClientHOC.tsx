'use client'

import React from 'react'

/**
 * Client components cannot be invoked on the server (fn()) and must be done on the client
 */
export const RenderClientHOC: React.FC<{
  Component: React.ComponentType
  HOC: (Component: React.ComponentType, RenderedComponent?: React.ReactNode) => React.ComponentType
  key?: string
  props: object
  RenderedComponent?: React.ReactNode
}> = ({ Component, HOC, key, props, RenderedComponent }) => {
  const ComponentToRender = HOC(Component, RenderedComponent)

  return <ComponentToRender key={key} {...props} />
}
