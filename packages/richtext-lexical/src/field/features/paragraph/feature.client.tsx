'use client'

import { $setBlocksType } from '@lexical/selection'
import { $createParagraphNode, $getSelection } from 'lexical'

import type { FeatureProviderProviderClient } from '../types.js'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'
import { TextIcon } from '../../lexical/ui/icons/Text/index.js'
import { TextDropdownSectionWithEntries } from '../common/floatingSelectToolbarTextDropdownSection/index.js'
import { createClientComponent } from '../createClientComponent.js'

const ParagraphFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      floatingSelectToolbar: {
        sections: [
          TextDropdownSectionWithEntries([
            {
              ChildComponent: TextIcon,
              isActive: () => false,
              key: 'normal-text',
              label: 'Normal Text',
              onClick: ({ editor }) => {
                editor.update(() => {
                  const selection = $getSelection()
                  $setBlocksType(selection, () => $createParagraphNode())
                })
              },
              order: 1,
            },
          ]),
        ],
      },
      slashMenu: {
        options: [
          {
            displayName: 'Basic',
            key: 'basic',
            options: [
              new SlashMenuOption('paragraph', {
                Icon: TextIcon,
                displayName: 'Paragraph',
                keywords: ['normal', 'paragraph', 'p', 'text'],
                onSelect: ({ editor }) => {
                  editor.update(() => {
                    const selection = $getSelection()
                    $setBlocksType(selection, () => $createParagraphNode())
                  })
                },
              }),
            ],
          },
        ],
      },
    }),
  }
}

export const ParagraphFeatureClientComponent = createClientComponent(ParagraphFeatureClient)
