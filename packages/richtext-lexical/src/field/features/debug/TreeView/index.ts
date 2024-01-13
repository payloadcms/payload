import type { FeatureProvider } from '../../types'

export const TreeViewFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        plugins: [
          {
            Component: () =>
              // @ts-ignore-next-line
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
