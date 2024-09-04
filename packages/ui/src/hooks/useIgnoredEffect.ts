import { dequal } from 'dequal/lite'
import { useEffect, useRef } from 'react'

/**
 * This hook is used to run an effect only when the dependencies change, but ignore some of them.
 * This is helpful when you're effect has a dependency that you don't want to trigger the effect.
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
