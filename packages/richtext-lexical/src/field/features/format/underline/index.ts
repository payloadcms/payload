import { FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { UnderlineIcon } from '../../../lexical/ui/icons/Underline'
import { SectionWithEntries } from '../common/floatingSelectToolbarSection'

export const UnderlineTextFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: UnderlineIcon,
                isActive: ({ editor, selection }) => selection.hasFormat('underline'),
                key: 'underline',
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
                },
                order: 3,
              },
            ]),
          ],
        },
      }
    },
    key: 'underline',
  }
}
