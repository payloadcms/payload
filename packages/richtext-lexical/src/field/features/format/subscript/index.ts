import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { SectionWithEntries } from '../common/floatingSelectToolbarSection'

export const SubscriptTextFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../../lexical/ui/icons/Subscript').then(
                    (module) => module.SubscriptIcon,
                  ),
                isActive: ({ selection }) => {
                  if ($isRangeSelection(selection)) {
                    return selection.hasFormat('subscript')
                  }
                  return false
                },
                key: 'subscript',
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')
                },
                order: 5,
              },
            ]),
          ],
        },
        props: null,
      }
    },
    key: 'subscript',
  }
}
