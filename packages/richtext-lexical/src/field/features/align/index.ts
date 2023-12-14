import { FORMAT_ELEMENT_COMMAND } from 'lexical'

import type { FeatureProvider } from '../types'

import { AlignDropdownSectionWithEntries } from './floatingSelectToolbarAlignDropdownSection'
import { translationsClient } from './translations'

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
                label: ({ i18n }) => i18n.t('lexical:align:alignLeft'),
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
                label: ({ i18n }) => i18n.t('lexical:align:alignCenter'),
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
                label: ({ i18n }) => i18n.t('lexical:align:alignRight'),
                onClick: ({ editor }) => {
                  editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')
                },
                order: 3,
              },
            ]),
          ],
        },
        i18nClient: translationsClient,
        props: null,
      }
    },
    key: 'align',
  }
}
