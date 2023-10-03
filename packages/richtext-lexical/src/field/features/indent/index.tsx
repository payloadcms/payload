import { INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../types'

import { IndentDecreaseIcon } from '../../lexical/ui/icons/IndentDecrease'
import { IndentIncreaseIcon } from '../../lexical/ui/icons/IndentIncrease'
import { IndentSectionWithEntries } from './floatingSelectToolbarIndentSection'
import './index.scss'

export const IndentFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        floatingSelectToolbar: {
          sections: [
            IndentSectionWithEntries([
              {
                ChildComponent: IndentDecreaseIcon,
                isActive: ({ editor, selection }) => false,
                isEnabled: ({ editor, selection }) => {
                  if (!selection || !selection?.getNodes()?.length) {
                    return false
                  }
                  for (const node of selection.getNodes()) {
                    // If at least one node is indented, this should be active
                    if (node.__indent > 0 || node.getParent().__indent > 0) {
                      return true
                    }
                  }
                  return false
                },
                key: 'indent-decrease',
                label: `Decrease Indent`,
                onClick: ({ editor }) => {
                  editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
                },
                order: 1,
              },
            ]),
            IndentSectionWithEntries([
              {
                ChildComponent: IndentIncreaseIcon,
                isActive: ({ editor, selection }) => false,
                key: 'indent-increase',
                label: `Increase Indent`,
                onClick: ({ editor }) => {
                  editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
                },
                order: 2,
              },
            ]),
          ],
        },
        props: null,
      }
    },
    key: 'indent',
  }
}
