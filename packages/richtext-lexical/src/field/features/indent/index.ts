import { INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../types'

import { IndentSectionWithEntries } from './floatingSelectToolbarIndentSection'

export const IndentFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        floatingSelectToolbar: {
          sections: [
            IndentSectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../lexical/ui/icons/IndentDecrease').then(
                    (module) => module.IndentDecreaseIcon,
                  ),
                isActive: () => false,
                isEnabled: ({ selection }) => {
                  if (!selection || !selection?.getNodes()?.length) {
                    return false
                  }
                  for (const node of selection.getNodes()) {
                    // If at least one node is indented, this should be active
                    if (
                      ('__indent' in node && (node.__indent as number) > 0) ||
                      (node.getParent() &&
                        '__indent' in node.getParent() &&
                        node.getParent().__indent > 0)
                    ) {
                      return true
                    }
                  }
                  return false
                },
                key: 'indent-decrease',
                label: `Decrease Indent`,
                onClick: ({ editor }) => {
                  editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
                },
                order: 1,
              },
            ]),
            IndentSectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../lexical/ui/icons/IndentIncrease').then(
                    (module) => module.IndentIncreaseIcon,
                  ),
                isActive: () => false,
                key: 'indent-increase',
                label: `Increase Indent`,
                onClick: ({ editor }) => {
                  editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
                },
                order: 2,
              },
            ]),
          ],
        },
        plugins: [
          {
            Component: () =>
              // @ts-expect-error
              import('./plugin').then((module) => module.IndentPlugin),
            position: 'normal',
          },
        ],
        props: null,
      }
    },
    key: 'indent',
  }
}
