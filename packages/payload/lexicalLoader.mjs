/** @type {'development' | 'production'} */
let environmentCondition

/** @param {'development' | 'production'} condition */
export function initialize(condition) {
  environmentCondition = condition
}

/** @type {import('node:module').ResolveHook} */
export const resolve = (specifier, context, nextResolve) => {
  if (
    (specifier === 'lexical' ||
      specifier.startsWith('lexical/') ||
      specifier.startsWith('@lexical/')) &&
    !context.conditions.includes('development') &&
    !context.conditions.includes('production')
  ) {
    // Preserve explicit conditions and leave every other package's resolution unchanged.
    return nextResolve(specifier, {
      ...context,
      conditions: [...context.conditions, environmentCondition],
    })
  }

  return nextResolve(specifier, context)
}
