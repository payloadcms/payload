import { FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { SuperscriptIcon } from '../../../lexical/ui/icons/Superscript'
import { SectionWithEntries } from '../common/floatingSelectToolbarSection'

export const SuperscriptTextFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: SuperscriptIcon,
                isActive: ({ editor, selection }) => selection.hasFormat('superscript'),
                key: 'superscript',
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')
                },
                order: 6,
              },
            ]),
          ],
        },
      }
    },
    key: 'superscript',
  }
}
