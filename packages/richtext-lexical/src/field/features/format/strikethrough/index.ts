import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { SectionWithEntries } from '../common/floatingSelectToolbarSection'
import { STRIKETHROUGH } from './markdownTransformers'

export const StrikethroughTextFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../../lexical/ui/icons/Strikethrough').then(
                    (module) => module.StrikethroughIcon,
                  ),
                isActive: ({ selection }) => {
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
      }
    },
    key: 'strikethrough',
  }
}
