import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { SectionWithEntries } from '../common/floatingSelectToolbarSection'

export const SuperscriptTextFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../../lexical/ui/icons/Superscript').then(
                    (module) => module.SuperscriptIcon,
                  ),
                isActive: ({ selection }) => {
                  if ($isRangeSelection(selection)) {
                    return selection.hasFormat('superscript')
                  }
                  return false
                },
                key: 'superscript',
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')
                },
                order: 6,
              },
            ]),
          ],
        },
        props: null,
      }
    },
    key: 'superscript',
  }
}
