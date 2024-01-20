import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { SectionWithEntries } from '../common/floatingSelectToolbarSection'
import { ITALIC_STAR, ITALIC_UNDERSCORE } from './markdownTransformers'

export const ItalicTextFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../../lexical/ui/icons/Italic').then((module) => module.ItalicIcon),
                isActive: ({ selection }) => {
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
        props: null,
      }
    },
    key: 'italic',
  }
}
