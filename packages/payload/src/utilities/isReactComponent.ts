import type React from 'react'

const clientRefSymbol = Symbol.for('react.client.reference')

export function isReactServerComponentOrFunction<T extends any>(
  component: any | React.ComponentType,
): component is T {
  return isSingleArgFunction(component) && component.$$typeof !== clientRefSymbol
}

export function isReactClientComponent<T extends any>(
  component: any | React.ComponentType,
): component is T {
  return isSingleArgFunction(component) && component.$$typeof === clientRefSymbol
}

export function isReactComponentOrFunction<T extends any>(
  component: any | React.ComponentType,
): component is T {
  return isSingleArgFunction(component)
}

function isSingleArgFunction(component: unknown): component is ((props: unknown) => unknown)& { $$typeof?: unknown } {
  return typeof component === 'function' && component.length === 1
}
