'use client'

/**
 * Client components cannot be invoked on the server (fn()) and must be done on the client
 */
export const RenderClientHOC: React.FC<{
  Component: React.ComponentType
  HOC?: (Component: React.ComponentType) => React.ComponentType
  key?: string
  props: object
}> = ({ Component, HOC, key, props }) => {
  let ComponentToRender = Component

  if (HOC) {
    ComponentToRender = HOC(Component)
  }

  return <ComponentToRender key={key} {...props} />
}
