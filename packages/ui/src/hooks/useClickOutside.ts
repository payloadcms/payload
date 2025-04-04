import { useEffect } from 'react'

import { useClickOutsideContext } from '../providers/ClickOutside/index.js'

export function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: () => void,
  enabled = true,
) {
  const { register, unregister } = useClickOutsideContext()

  useEffect(() => {
    if (!enabled || !ref.current) {
      return
    }

    const listener = { handler, ref }
    register(listener)
    return () => unregister(listener)
  }, [ref, handler, enabled, register, unregister])
}
