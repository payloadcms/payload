import { isReactServerComponentOrFunction } from 'payload/shared'

import { RenderClientHOC } from './RenderClientHOC.js'

/**
 * Client components cannot be invoked on the server and must be done on the client. Here are some rules:
 * - If the HOC a server component, it can be invoked on the server (HOC()). Its component to render can be either a server or client component.
 * - If the HOC is a client component, it must be rendered a component on the client (<HOC />). Its component to render MUST be a client component OR a pre-rendered server component.
 */
export const WithHOC: React.FC<{
  Component: React.ComponentType
  componentKey?: string
  HOC?: (Component: React.ComponentType, RenderedComponent?: React.FC) => React.ComponentType
  isRSC: boolean
  props: object
}> = ({ Component, componentKey, HOC, isRSC, props }) => {
  let ComponentToRender = Component

  const HOCisRSC = isReactServerComponentOrFunction(HOC)

  if (HOCisRSC) {
    ComponentToRender = HOC(Component)
  } else if (!HOCisRSC) {
    if (isRSC) {
      return (
        <RenderClientHOC
          HOC={HOC}
          key={componentKey}
          RenderedComponent={<Component {...props} />}
        />
      )
    } else {
      return <RenderClientHOC Component={Component} HOC={HOC} key={componentKey} props={props} />
    }
  }

  return <ComponentToRender key={componentKey} {...props} />
}
