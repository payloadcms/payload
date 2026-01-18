import React from 'react';
const LazyReactComponentSymbol = Symbol.for('react.lazy');
/**
 * Since Next.js 15.4, `React.isValidElement()` returns `false` for components that cross the server-client boundary.
 * This utility expands on that check so that it returns true for valid React elements.
 */
export function isValidReactElement(object) {
  return React.isValidElement(object) || object?.['$$typeof'] === LazyReactComponentSymbol;
}
//# sourceMappingURL=isValidReactElement.js.map