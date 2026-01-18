import type React from 'react';
type useThrottledEffect = (callback: React.EffectCallback, delay: number, deps: React.DependencyList) => void;
/**
 * A hook that will throttle the execution of a callback function inside a useEffect.
 * This is useful for things like throttling loading states or other UI updates.
 * @param callback The callback function to be executed.
 * @param delay The delay in milliseconds to throttle the callback.
 * @param deps The dependencies to watch for changes.
 */
export declare const useThrottledEffect: useThrottledEffect;
export {};
//# sourceMappingURL=useThrottledEffect.d.ts.map