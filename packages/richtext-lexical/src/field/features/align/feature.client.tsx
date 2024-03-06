'use client'

import { FORMAT_ELEMENT_COMMAND } from 'lexical'

import type { FeatureProviderProviderClient } from '../types.js'

import { AlignCenterIcon } from '../../lexical/ui/icons/AlignCenter/index.js'
import { AlignJustifyIcon } from '../../lexical/ui/icons/AlignJustify/index.js'
import { AlignLeftIcon } from '../../lexical/ui/icons/AlignLeft/index.js'
import { AlignRightIcon } from '../../lexical/ui/icons/AlignRight/index.js'
import { createClientComponent } from '../createClientComponent.js'
import { AlignDropdownSectionWithEntries } from './floatingSelectToolbarAlignDropdownSection.js'

const AlignFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      floatingSelectToolbar: {
        sections: [
          AlignDropdownSectionWithEntries([
            {
              ChildComponent: AlignLeftIcon,
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
              ChildComponent: AlignCenterIcon,
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
              ChildComponent: AlignRightIcon,
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
              ChildComponent: AlignJustifyIcon,
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
    }),
  }
}

export const AlignFeatureClientComponent = createClientComponent(AlignFeatureClient)
