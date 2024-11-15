import React from 'react'

export const RouteTransition: React.FC<RouteTransitionProps> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = React.useState(false)

  return (
    <RouteTransitionContext.Provider value={{ isTransitioning, setIsTransitioning }}>
      {children}
    </RouteTransitionContext.Provider>
  )
}

type RouteTransitionProps = {
  children: React.ReactNode
}

type RouteTransitionContextValue = {
  isTransitioning: boolean
  setIsTransitioning: (isTransitioning: boolean) => void
}

const RouteTransitionContext = React.createContext<RouteTransitionContextValue>({
  isTransitioning: false,
  setIsTransitioning: () => {},
})

export const useRouteTransition = () => React.useContext(RouteTransitionContext)
