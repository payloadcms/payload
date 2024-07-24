import { useEffect, useRef } from 'react'

type useThrottledEffect = (
  callback: React.EffectCallback,
  delay: number,
  deps: React.DependencyList,
) => void

export const useThrottledEffect: useThrottledEffect = (callback, delay, deps = []) => {
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(
      () => {
        if (Date.now() - lastRan.current >= delay) {
          callback()
          lastRan.current = Date.now()
        }
      },
      delay - (Date.now() - lastRan.current),
    )

    return () => {
      clearTimeout(handler)
    }
  }, [delay, ...deps])
}
