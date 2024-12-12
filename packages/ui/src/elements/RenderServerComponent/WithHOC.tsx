import { isReactServerComponentOrFunction } from 'payload/shared'

import { RenderClientHOC } from './RenderClientHOC.js'

/**
 * Client components cannot be invoked on the server and must be done on the client. Here are some rules:
 * - If the HOC a server component, it can be invoked on the server (HOC()). Its component to render can be either a server or client component.
 * - If the HOC is a client component, it must be rendered a component on the client (<HOC />). Its component to render MUST be a client component.
 */
export const WithHOC: React.FC<{
  Component: React.ComponentType
  HOC?: (Component: React.ComponentType) => React.ComponentType
  isRSC: boolean
  key?: string
  props: object
}> = ({ Component, HOC, isRSC, key, props }) => {
  let ComponentToRender = Component

  const HOCisRSC = isReactServerComponentOrFunction(HOC)

  if (HOCisRSC) {
    ComponentToRender = HOC(Component)
  } else if (!HOCisRSC && !isRSC) {
    return <RenderClientHOC Component={Component} HOC={HOC} key={key} props={props} />
  } else {
    console.warn(
      'RenderServerComponent: HOC is a client component but Component is a server component. This is not allowed.',
    )
  }

  return <ComponentToRender key={key} {...props} />
}
