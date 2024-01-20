import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../../types'

import { SectionWithEntries } from '../common/floatingSelectToolbarSection'
import { INLINE_CODE } from './markdownTransformers'

export const InlineCodeTextFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../../lexical/ui/icons/Code').then((module) => module.CodeIcon),
                isActive: ({ selection }) => {
                  if ($isRangeSelection(selection)) {
                    return selection.hasFormat('code')
                  }
                  return false
                },
                key: 'code',
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')
                },
                order: 7,
              },
            ]),
          ],
        },
        markdownTransformers: [INLINE_CODE],
        props: null,
      }
    },
    key: 'inlineCode',
  }
}
