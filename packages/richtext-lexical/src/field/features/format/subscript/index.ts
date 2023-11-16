import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { SubscriptIcon } from '../../../lexical/ui/icons/Subscript'
import { SectionWithEntries } from '../common/floatingSelectToolbarSection'

export const SubscriptTextFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: SubscriptIcon,
                isActive: ({ editor, selection }) => {
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
