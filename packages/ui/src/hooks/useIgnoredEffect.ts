import { dequal } from 'dequal/lite'
import { useEffect, useRef } from 'react'

/**
 * Allows for a `useEffect` hook to be precisely triggered based on whether a only _subset_ of its dependencies have changed, as opposed to all of them. This is useful if you have a list of dependencies that change often, but need to scope your effect's logic to only explicit dependencies within that list.
 * @constructor
 * @param {React.EffectCallback} effect - The effect to run
 * @param {React.DependencyList} deps - Dependencies that should trigger the effect
 * @param {React.DependencyList} ignoredDeps - Dependencies that should _not_ trigger the effect
 * @param {Object} options - Additional options to configure the hook
 * @param {boolean} options.runOnFirstRender - Whether the effect should run on the first render
 * @example
 * useIgnoredEffect(() => {
 *  console.log('This will run when `foo` changes, but not when `bar` changes')
 * }, [foo], [bar])
 */
export function useIgnoredEffect(
  effect: React.EffectCallback,
  deps: React.DependencyList,
  ignoredDeps: React.DependencyList,
  options?: { runOnFirstRender?: boolean },
) {
  const hasInitialized = useRef(
    typeof options?.runOnFirstRender !== 'undefined' ? Boolean(!options?.runOnFirstRender) : false,
  )

  const prevDeps = useRef(deps)

  useEffect(() => {
    const depsHaveChanged = deps.some(
      (dep, index) => !ignoredDeps.includes(dep) && !dequal(dep, prevDeps.current[index]),
    )

    if (depsHaveChanged || !hasInitialized.current) {
      effect()
    }

    prevDeps.current = deps
    hasInitialized.current = true
  }, deps)
}
