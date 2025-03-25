'use client'
import React, { startTransition, useCallback, useEffect, useOptimistic, useRef } from 'react'

/**
 * Route transitions are useful in showing immediate visual feedback to the user when navigating between pages. This is especially useful on slow networks when navigating to data heavy or process intensive pages.
 * To use route transitions, place the `RouteTransitionProvider` at the root of your application, outside of the `ProgressBar` component.
 * To trigger a route transition, use the `Link` component from `@payloadcms/ui`,
 * or wrap a callback function with the `startRouteTransition` method.
 * To gain access to the `RouteTransitionContext`, call the `useRouteTransition` hook in your component.
 * @returns A context provider with methods and state for transitioning between routes, including `isTransitioning`, `startRouteTransition`, and `transitionProgress`.
 * @example
 * import { RouteTransitionProvider, ProgressBar, Link } from '@payloadcms/ui'
 * const App = () => (
 *  <RouteTransitionProvider>
 *   <ProgressBar />
 *   <Link href="/somewhere">Go Somewhere</Link>
 *  </RouteTransitionProvider>
 * )
 */
export const RouteTransitionProvider: React.FC<RouteTransitionProps> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useOptimistic(false)
  const [transitionProgress, setTransitionProgress] = React.useState<number>(0)

  const transitionProgressRef = useRef(transitionProgress)

  const timerID = useRef(null)

  const initiateProgress = useCallback(() => {
    timerID.current = setInterval(() => {
      // randomly update progress using an exponential curve
      // cap the progress to ensure it never fully reaches completion
      // accelerate quickly then decelerate slowly
      const maxProgress = 0.93
      const jumpFactor = 0.2 // lower to reduce jumps in progress
      const growthFactor = 0.75 // adjust to control acceleration
      const slowdownFactor = 0.75 // adjust to control deceleration

      const newProgress =
        transitionProgressRef.current +
        (maxProgress - transitionProgressRef.current) *
          Math.random() *
          jumpFactor *
          Math.pow(Math.log(1 + (1 - transitionProgressRef.current) * growthFactor), slowdownFactor)

      setTransitionProgress(newProgress)
      transitionProgressRef.current = newProgress
    }, 250) // every n ms, update progress
  }, [])

  useEffect(() => {
    setTransitionProgress(0)
    transitionProgressRef.current = 0

    if (isTransitioning) {
      initiateProgress()
    } else {
      if (timerID.current) {
        clearInterval(timerID.current)
      }
    }
  }, [isTransitioning, initiateProgress])

  const startRouteTransition: StartRouteTransition = useCallback(
    (callback?: () => void) => {
      startTransition(() => {
        setIsTransitioning(true)

        if (typeof callback === 'function') {
          callback()
        }
      })
    },
    [setIsTransitioning],
  )

  return (
    <RouteTransitionContext value={{ isTransitioning, startRouteTransition, transitionProgress }}>
      {children}
    </RouteTransitionContext>
  )
}

type RouteTransitionProps = {
  children: React.ReactNode
}

type StartRouteTransition = (callback?: () => void) => void

type RouteTransitionContextValue = {
  isTransitioning: boolean
  startRouteTransition: StartRouteTransition
  transitionProgress: number
}

const RouteTransitionContext = React.createContext<RouteTransitionContextValue>({
  isTransitioning: false,
  startRouteTransition: () => undefined,
  transitionProgress: 0,
})

/**
 * Use this hook to access the `RouteTransitionContext` provided by the `RouteTransitionProvider`.
 * To start a transition, fire the `startRouteTransition` method with a provided callback to run while the transition takes place.
 * @returns The `RouteTransitionContext` needed for transitioning between routes, including `isTransitioning`, `startRouteTransition`, and `transitionProgress`.
 * @example
 * 'use client'
 * import React, { useCallback } from 'react'
 * import { useTransition } from '@payloadcms/ui'
 * import { useRouter } from 'next/navigation'
 *
 * const MyComponent: React.FC = () => {
 *   const router = useRouter()
 *   const { startRouteTransition } = useRouteTransition()
 *
 *   const redirectSomewhere = useCallback(() => {
 *     startRouteTransition(() => router.push('/somewhere'))
 *   }, [startRouteTransition, router])
 *
 *   // ...
 * }
 */
export const useRouteTransition = () => React.use(RouteTransitionContext)
