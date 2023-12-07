import type { FeatureProvider } from '../../types'

export const TreeviewFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        plugins: [
          {
            Component: () =>
              // @ts-expect-error
              import('./plugin').then((module) => module.TreeViewPlugin),
            position: 'bottom',
          },
        ],
        props: null,
      }
    },
    key: 'debug-treeview',
  }
}
