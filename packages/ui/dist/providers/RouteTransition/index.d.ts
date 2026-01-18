import React from 'react';
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
export declare const RouteTransitionProvider: React.FC<RouteTransitionProps>;
type RouteTransitionProps = {
    children: React.ReactNode;
};
type StartRouteTransition = (callback?: () => void) => void;
type RouteTransitionContextValue = {
    isTransitioning: boolean;
    startRouteTransition: StartRouteTransition;
    transitionProgress: number;
};
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
export declare const useRouteTransition: () => RouteTransitionContextValue;
export {};
//# sourceMappingURL=index.d.ts.map