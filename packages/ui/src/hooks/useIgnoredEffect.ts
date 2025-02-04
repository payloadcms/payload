import { useEffect, useRef } from 'react'

import { useDebouncedEffect } from './useDebouncedEffect.js'

/**
 * Allows for a `useEffect` hook to be precisely triggered based on whether a only _subset_ of its dependencies have changed, as opposed to all of them. This is useful if you have a list of dependencies that change often, but need to scope your effect's logic to only explicit dependencies within that list.
 * @constructor
 * @param {React.EffectCallback} effect - The effect to run
 * @param {React.DependencyList} deps - Dependencies that should trigger the effect
 * @param {object} ignoredDeps - Dependencies that should _not_ trigger the effect
 * @example
 * useIgnoredEffect(({bar}}) => {
 *  console.log('This will run when `foo` changes, but not when `bar` changes. The current value of `bar` is:', bar)
 * }, [foo], {bar})
 */
export function useIgnoredEffect<TIgnoredDependencyList extends object>(
  effect: (ignoredDeps: TIgnoredDependencyList) => (() => undefined | void) | void,
  deps: React.DependencyList,
  ignoredDeps: TIgnoredDependencyList,
) {
  const ignoredDepsRef = useRef(ignoredDeps)

  // Keep the ref updated with the latest ignoredDeps, but do NOT trigger the main effect
  useEffect(() => {
    ignoredDepsRef.current = ignoredDeps
  }, [ignoredDeps])

  // The main effect that only runs when deps change. Ignored deps are passed as an argument
  useEffect(() => {
    return effect(ignoredDepsRef.current)
  }, deps)
}

export function useIgnoredEffectDebounced<TIgnoredDependencyList extends object>(
  effect: (ignoredDeps: TIgnoredDependencyList) => (() => undefined | void) | void,
  deps: React.DependencyList,
  ignoredDeps: TIgnoredDependencyList,
  options?: { delay?: number },
) {
  const ignoredDepsRef = useRef(ignoredDeps)

  // Keep the ref updated with the latest ignoredDeps, but do NOT trigger the main effect
  useEffect(() => {
    ignoredDepsRef.current = ignoredDeps
  }, [ignoredDeps])

  // The main effect that only runs when deps change. Ignored deps are passed as an argument
  useDebouncedEffect(
    () => {
      return effect(ignoredDepsRef.current)
    },
    deps,
    options?.delay || 0,
  )
}
