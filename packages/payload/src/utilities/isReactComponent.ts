import type React from 'react'

import { isPlainObject } from './isPlainObject.js'

export function isValidReactComponentType(component: unknown): component is React.ComponentType {
  const isClassComponent =
    typeof component === 'function' &&
    component.prototype &&
    typeof component.prototype.render === 'function'

  const componentString = String(component)
  const isFunctionalComponent =
    typeof component === 'function' &&
    (componentString.includes('return React.createElement') ||
      componentString.includes('react_jsx_dev_runtime__'))

  return isClassComponent || isFunctionalComponent
}

export function isReactServerComponent<T extends any>(
  component: React.ComponentType | any,
): component is T {
  return typeof component === 'function' && isValidReactComponentType(component)
}

export function isReactClientComponent<T extends any>(
  component: React.ComponentType | any,
): component is T {
  // Do this to test for client components (`use client` directive) bc they import as empty objects
  return typeof component === 'object' && !isPlainObject(component)
}

export function isReactComponent<T extends any>(
  component: React.ComponentType | any,
): component is T {
  return isReactServerComponent(component) || isReactClientComponent(component)
}

export function isPlainFunction<T extends Function>(fn: any): fn is T {
  return typeof fn === 'function' && !isReactComponent(fn)
}
