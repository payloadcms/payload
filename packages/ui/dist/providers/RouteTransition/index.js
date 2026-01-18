'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { startTransition, useCallback, useEffect, useOptimistic, useRef } from 'react';
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
export const RouteTransitionProvider = t0 => {
  const $ = _c(11);
  const {
    children
  } = t0;
  const [isTransitioning, setIsTransitioning] = useOptimistic(false);
  const [transitionProgress, setTransitionProgress] = React.useState(0);
  const transitionProgressRef = useRef(transitionProgress);
  const timerID = useRef(null);
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      timerID.current = setInterval(() => {
        const newProgress = transitionProgressRef.current + (0.93 - transitionProgressRef.current) * Math.random() * 0.2 * Math.pow(Math.log(1 + (1 - transitionProgressRef.current) * 0.75), 0.75);
        setTransitionProgress(newProgress);
        transitionProgressRef.current = newProgress;
      }, 250);
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const initiateProgress = t1;
  let t2;
  let t3;
  if ($[1] !== isTransitioning) {
    t2 = () => {
      setTransitionProgress(0);
      transitionProgressRef.current = 0;
      if (isTransitioning) {
        initiateProgress();
      } else {
        if (timerID.current) {
          clearInterval(timerID.current);
        }
      }
    };
    t3 = [isTransitioning, initiateProgress];
    $[1] = isTransitioning;
    $[2] = t2;
    $[3] = t3;
  } else {
    t2 = $[2];
    t3 = $[3];
  }
  useEffect(t2, t3);
  let t4;
  if ($[4] !== setIsTransitioning) {
    t4 = callback => {
      startTransition(() => {
        setIsTransitioning(true);
        if (typeof callback === "function") {
          callback();
        }
      });
    };
    $[4] = setIsTransitioning;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  const startRouteTransition = t4;
  let t5;
  if ($[6] !== children || $[7] !== isTransitioning || $[8] !== startRouteTransition || $[9] !== transitionProgress) {
    t5 = _jsx(RouteTransitionContext, {
      value: {
        isTransitioning,
        startRouteTransition,
        transitionProgress
      },
      children
    });
    $[6] = children;
    $[7] = isTransitioning;
    $[8] = startRouteTransition;
    $[9] = transitionProgress;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  return t5;
};
const RouteTransitionContext = /*#__PURE__*/React.createContext({
  isTransitioning: false,
  // Default implementation: just call the callback directly (no transition animation)
  startRouteTransition: callback => {
    if (typeof callback === 'function') {
      callback();
    }
  },
  transitionProgress: 0
});
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
export const useRouteTransition = () => React.use(RouteTransitionContext);
//# sourceMappingURL=index.js.map