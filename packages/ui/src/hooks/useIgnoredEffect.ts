import { dequal } from 'dequal/lite'
import { useEffect, useRef } from 'react'

// This hook is used to run an effect only when the dependencies change, but ignore some of them.
// This is helpful when you're effect has a dependency that you don't want to trigger the effect.
export function useIgnoredEffect(
  /** The effect to run */
  effect: React.EffectCallback,
  /** Dependencies that should trigger the effect */
  deps: React.DependencyList,
  /** Dependencies that should _not_ trigger the effect */
  ignoredDeps: React.DependencyList,
  /** Additional options to configure the hook */
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
