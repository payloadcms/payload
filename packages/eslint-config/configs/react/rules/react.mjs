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
}

export default index
