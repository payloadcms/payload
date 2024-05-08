import type React from 'react'

import { isPlainObject } from './isPlainObject.js'

export function isReactServerComponentOrFunction<T extends any>(
  component: React.ComponentType | any,
): component is T {
  const isClassComponent =
    typeof component === 'function' &&
    component.prototype &&
    typeof component.prototype.render === 'function'

  const isFunctionalComponent =
    typeof component === 'function' && (!component.prototype || !component.prototype.render)

  return isClassComponent || isFunctionalComponent
}

export function isReactClientComponent<T extends any>(
  component: React.ComponentType | any,
): component is T {
  // Do this to test for client components (`use client` directive) bc they import as empty objects
  return typeof component === 'object' && !isPlainObject(component)
}

export function isReactComponentOrFunction<T extends any>(
  component: React.ComponentType | any,
): component is T {
  return isReactServerComponentOrFunction(component) || isReactClientComponent(component)
}
