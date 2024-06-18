import type React from 'react'

import { isPlainObject } from './isPlainObject.js'

/*
For reference: console.log output of [ClientComponent, RSC] array, tested in Turbo and Webpack (14.3.0-canary.37)

Both component functions async:

Turbo: [ [Function (anonymous)], [AsyncFunction: ExampleServer] ]
Webpack: [ {}, [AsyncFunction: ExampleServer] ]


Both component functions non-async:

Turbo:  [ [Function (anonymous)], [Function: ExampleServer] ]
Webpack:  [ {}, [Function: ExampleServer] ]

 */

export function isReactServerComponentOrFunction<T extends any>(
  component: React.ComponentType | any,
): component is T {
  const isClassComponent =
    typeof component === 'function' &&
    component.prototype &&
    typeof component.prototype.render === 'function'

  const isFunctionalComponent =
    typeof component === 'function' && (!component.prototype || !component.prototype.render)

  // Anonymous functions are Client Components in Turbopack. RSCs should have a name
  const isAnonymousFunction = typeof component === 'function' && component.name === ''

  return (isClassComponent || isFunctionalComponent) && !isAnonymousFunction
}

export function isReactClientComponent<T extends any>(
  component: React.ComponentType | any,
): component is T {
  const isClientComponentWebpack = typeof component === 'object' && !isPlainObject(component) // In Webpack, client components are {}
  const isClientComponentTurbo = typeof component === 'function' && component.name === '' // Anonymous functions are Client Components in Turbopack

  return isClientComponentWebpack || isClientComponentTurbo
}

export function isReactComponentOrFunction<T extends any>(
  component: React.ComponentType | any,
): component is T {
  return isReactServerComponentOrFunction(component) || isReactClientComponent(component)
}
