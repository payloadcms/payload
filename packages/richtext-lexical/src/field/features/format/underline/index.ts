import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { SectionWithEntries } from '../common/floatingSelectToolbarSection'

export const UnderlineTextFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../../lexical/ui/icons/Underline').then(
                    (module) => module.UnderlineIcon,
                  ),
                isActive: ({ selection }) => {
                  if ($isRangeSelection(selection)) {
                    return selection.hasFormat('underline')
                  }
                  return false
                },
                key: 'underline',
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
                },
                order: 3,
              },
            ]),
          ],
        },
        props: null,
      }
    },
    key: 'underline',
  }
}
