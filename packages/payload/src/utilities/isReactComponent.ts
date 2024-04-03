import type React from 'react'

import { isPlainObject } from './isPlainObject.js'

export function isReactComponent<T extends any>(
  component: React.ComponentType | any,
): component is T {
  return (
    typeof component === 'function' ||
    // Do this to test for client components (`use client` directive) bc they import as empty objects
    (typeof component === 'object' && !isPlainObject(component))
  )
}
