'use client'

import { FORMAT_ELEMENT_COMMAND } from 'lexical'

import type { FeatureProviderProviderClient } from '../types'

import { AlignCenterIcon } from '../../lexical/ui/icons/AlignCenter'
import { AlignJustifyIcon } from '../../lexical/ui/icons/AlignJustify'
import { AlignLeftIcon } from '../../lexical/ui/icons/AlignLeft'
import { AlignRightIcon } from '../../lexical/ui/icons/AlignRight'
import { createClientComponent } from '../createClientComponent'
import { AlignDropdownSectionWithEntries } from './floatingSelectToolbarAlignDropdownSection'

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
