import type React from 'react'

import { isValidElement } from 'react'

import { isPlainObject } from './isPlainObject.js'

export function isReactComponent<T extends any>(
  component: React.ComponentType | any,
): component is T {
  return (
    (typeof component === 'function' && isValidElement(component)) ||
    // Do this to test for client components (`use client` directive) bc they import as empty objects
    (typeof component === 'object' && !isPlainObject(component))
  )
}

export function isPlainFunction<T extends Function>(fn: any): fn is T {
  return typeof fn === 'function' && !isReactComponent(fn)
}
