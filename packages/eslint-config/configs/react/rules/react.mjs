/** @type {import('eslint').Linter.Config} */
export const index = {
  '@eslint-react/dom/no-dangerously-set-innerhtml': 'off',
  '@eslint-react/dom/no-dangerously-set-innerhtml-with-children': 'off',
  '@eslint-react/no-unsafe-component-will-mount': 'off',
  '@eslint-react/no-unsafe-component-will-receive-props': 'off',
  '@eslint-react/no-unsafe-component-will-update': 'off',
  '@eslint-react/no-set-state-in-component-did-mount': 'off',
  '@eslint-react/no-set-state-in-component-did-update': 'off',
  '@eslint-react/no-set-state-in-component-will-update': 'off',
  '@eslint-react/no-missing-component-display-name': 'off',
  '@eslint-react/no-direct-mutation-state': 'off',
  '@eslint-react/no-array-index-key': 'off',
  '@eslint-react/no-unstable-default-props': 'off', // TODO: Evaluate enabling this
  '@eslint-react/no-unstable-context-value': 'off', // TODO: Evaluate enabling this
  // Too many false positives: flags components returned from memoized custom hooks (e.g. useDocumentDrawer),
  // components passed via props/context, and components resolved from the import map - none of which are
  // actually re-created during render. React Compiler rules already cover genuine render-safety hazards.
  '@eslint-react/static-components': 'off',
  // Disabled: too many false positives - flags components returned from memoized custom hooks,
  // passed via props/context, or resolved from the import map, none of which are re-created during render.
  'react-hooks/static-components': 'off',
  // TODO: Set back to 'error' and fix all `set-state-in-effect` violations across the codebase.
  // Downgraded to 'warn' for now to unblock the eslint bump - these are calls to a useState setter
  // synchronously within an effect, which trigger cascading renders and should be derived via useMemo instead.
  'react-hooks/set-state-in-effect': 'warn',
  // TODO: Set back to 'error' and investigate/fix later. These React Compiler rules currently surface
  // intentional Payload patterns as false positives (latest-value-in-ref context providers, hand-written
  // memoization the compiler can't take over, ref access in editor plugins, etc.). Downgraded to 'warn'
  // for now to unblock the eslint bump.
  'react-hooks/refs': 'warn',
  'react-hooks/preserve-manual-memoization': 'warn',
  'react-hooks/purity': 'warn',
  'react-hooks/immutability': 'warn',
  'react-hooks/use-memo': 'warn',
  '@eslint-react/use-memo': 'warn',
  'react-hooks/error-boundaries': 'warn',
  '@eslint-react/error-boundaries': 'warn',
}

export default index
