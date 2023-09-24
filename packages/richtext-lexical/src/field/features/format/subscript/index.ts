import { FORMAT_TEXT_COMMAND } from 'lexical'

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
                isActive: (editor, selection) => selection.hasFormat('subscript'),
                key: 'subscript',
                onClick: (editor) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')
                },
                order: 5,
              },
            ]),
          ],
        },
      }
    },
    key: 'subscript',
  }
}
