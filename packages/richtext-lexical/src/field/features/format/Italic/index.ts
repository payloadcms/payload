import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { ItalicIcon } from '../../../lexical/ui/icons/Italic'
import { SectionWithEntries } from '../common/floatingSelectToolbarSection'
import { ITALIC_STAR, ITALIC_UNDERSCORE } from './markdownTransformers'

export const ItalicTextFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: ItalicIcon,
                isActive: ({ editor, selection }) => {
                  if ($isRangeSelection(selection)) {
                    return selection.hasFormat('italic')
                  }
                  return false
                },
                key: 'italic',
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
                },
                order: 2,
              },
            ]),
          ],
        },
        markdownTransformers: [ITALIC_STAR, ITALIC_UNDERSCORE],
      }
    },
    key: 'italic',
  }
}
