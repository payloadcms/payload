import { FORMAT_ELEMENT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../types'

import { AlignCenterIcon } from '../../lexical/ui/icons/AlignCenter'
import { AlignLeftIcon } from '../../lexical/ui/icons/AlignLeft'
import { AlignDropdownSectionWithEntries } from './floatingSelectToolbarAlignDropdownSection'
import './index.scss'

export const AlignFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        floatingSelectToolbar: {
          sections: [
            AlignDropdownSectionWithEntries([
              {
                ChildComponent: AlignLeftIcon,
                isActive: ({ editor, selection }) => false,
                key: 'align-left',
                label: `Align Left`,
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')
                },
                order: 1,
              },
            ]),
            AlignDropdownSectionWithEntries([
              {
                ChildComponent: AlignCenterIcon,
                isActive: ({ editor, selection }) => false,
                key: 'align-center',
                label: `Align Center`,
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')
                },
                order: 2,
              },
            ]),
            AlignDropdownSectionWithEntries([
              {
                ChildComponent: AlignLeftIcon,
                isActive: ({ editor, selection }) => false,
                key: 'align-right',
                label: `Align Right`,
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')
                },
                order: 3,
              },
            ]),
          ],
        },
        props: null,
      }
    },
    key: 'align',
  }
}
