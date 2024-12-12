'use client'

import React from 'react'

import type { additionalHOCArgs, HOC } from './WithHOC.js'

/**
 * Client components cannot be invoked on the server (fn()) and must be done on the client
 * This means if the HOC sent is a client component, it MUST be invoked within the `use client` directive
 */
export const RenderClientHOC: React.FC<{
  additionalHOCArgs?: additionalHOCArgs
  Component?: React.ComponentType
  HOC: HOC
  key?: string
  props?: object
  RenderedComponent?: React.ReactNode
}> = ({ additionalHOCArgs, Component, HOC, key, props, RenderedComponent }) => {
  const ComponentToRender = HOC(Component, RenderedComponent, ...(additionalHOCArgs || []))

  return <ComponentToRender key={key} {...props} />
}
