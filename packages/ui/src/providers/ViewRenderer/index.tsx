import React from 'react'

import type { ViewComponentRenderer } from '../../utilities/createViewRenderer.js'

const ViewRendererContext = React.createContext<null | ViewComponentRenderer>(null)

export const ViewRendererProvider = ({
  children,
  renderer,
}: {
  children: React.ReactNode
  renderer: ViewComponentRenderer
}) => {
  return <ViewRendererContext value={renderer}>{children}</ViewRendererContext>
}

export const useViewRenderer = (): null | ViewComponentRenderer => {
  return React.use(ViewRendererContext)
}
