import { FORMAT_ELEMENT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../types'

import { AlignDropdownSectionWithEntries } from './floatingSelectToolbarAlignDropdownSection'

export const AlignFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        floatingSelectToolbar: {
          sections: [
            AlignDropdownSectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../lexical/ui/icons/AlignLeft').then((module) => module.AlignLeftIcon),
                isActive: () => false,
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
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../lexical/ui/icons/AlignCenter').then(
                    (module) => module.AlignCenterIcon,
                  ),
                isActive: () => false,
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
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../lexical/ui/icons/AlignRight').then(
                    (module) => module.AlignRightIcon,
                  ),
                isActive: () => false,
                key: 'align-right',
                label: `Align Right`,
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')
                },
                order: 3,
              },
            ]),
            AlignDropdownSectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../lexical/ui/icons/AlignJustify').then(
                    (module) => module.AlignJustifyIcon,
                  ),
                isActive: () => false,
                key: 'align-justify',
                label: `Align Justify`,
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')
                },
                order: 4,
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
