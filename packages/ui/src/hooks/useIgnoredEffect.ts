import { dequal } from 'dequal/lite'
import { useEffect, useRef } from 'react'

// This hook is used to run an effect only when the dependencies change, but ignore some of them.
// This is helpful when you're effect has a dependency that you don't want to trigger the effect.
export function useIgnoredEffect(
  effect: React.EffectCallback,
  deps: React.DependencyList,
  ignoredDeps: React.DependencyList,
  options?: { runOnFirstRender?: boolean },
) {
  // optionally don't run on first render
  const hasInitialized = useRef(options?.runOnFirstRender ?? true)

  const prevDeps = useRef(deps)

  useEffect(() => {
    const depsHaveChanged = deps.some(
      (dep, index) => !ignoredDeps.includes(dep) && dequal(dep, prevDeps.current[index]),
    )

    if (depsHaveChanged && hasInitialized.current) {
      effect()
    }

    prevDeps.current = deps
    hasInitialized.current = true
  }, deps)
}
