'use client'
import * as React from 'react'

type Result = [boolean, () => void]
export const useDelay = (delay: number, triggerOnMount = false): Result => {
  const [hasDelayed, setHasDelayed] = React.useState(false)
  const triggerTimeoutRef = React.useRef<NodeJS.Timeout>(undefined)

  const triggerDelay = React.useCallback(() => {
    setHasDelayed(false)
    clearTimeout(triggerTimeoutRef.current)
    triggerTimeoutRef.current = setTimeout(() => {
      setHasDelayed(true)
    }, delay)

    return () => {
      clearTimeout(triggerTimeoutRef.current)
    }
  }, [delay])

  React.useEffect(() => {
    if (triggerOnMount) {
      triggerDelay()
    }
  }, [triggerDelay, triggerOnMount])

  return [hasDelayed, triggerDelay]
}
