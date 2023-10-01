import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { StrikethroughIcon } from '../../../lexical/ui/icons/Strikethrough'
import { SectionWithEntries } from '../common/floatingSelectToolbarSection'
import { STRIKETHROUGH } from './markdownTransformers'

export const StrikethroughTextFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: StrikethroughIcon,
                isActive: ({ editor, selection }) => {
                  if ($isRangeSelection(selection)) {
                    return selection.hasFormat('strikethrough')
                  }
                  return false
                },
                key: 'strikethrough',
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
                },
                order: 4,
              },
            ]),
          ],
        },
        markdownTransformers: [STRIKETHROUGH],
        props: null,
        props: null,
      }
    },
    key: 'strikethrough',
  }
}
