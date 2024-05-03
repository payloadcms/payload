'use client'

import { $setBlocksType } from '@lexical/selection'
import { $createParagraphNode, $getSelection } from 'lexical'

import type { FeatureProviderProviderClient } from '../types.js'

import { TextIcon } from '../../lexical/ui/icons/Text/index.js'
import { createClientComponent } from '../createClientComponent.js'
import { inlineToolbarTextDropdownGroupWithItems } from '../shared/inlineToolbar/textDropdownGroup.js'

const ParagraphFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      slashMenu: {
        groups: [
          {
            displayName: 'Basic',
            items: [
              {
                Icon: TextIcon,
                displayName: 'Paragraph',
                key: 'paragraph',
                keywords: ['normal', 'paragraph', 'p', 'text'],
                onSelect: ({ editor }) => {
                  editor.update(() => {
                    const selection = $getSelection()
                    $setBlocksType(selection, () => $createParagraphNode())
                  })
                },
              },
            ],
            key: 'basic',
          },
        ],
      },
      toolbarInline: {
        groups: [
          inlineToolbarTextDropdownGroupWithItems([
            {
              ChildComponent: TextIcon,
              isActive: () => false,
              key: 'paragraph',
              label: 'Normal Text',
              onSelect: ({ editor }) => {
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
    }),
  }
}

export const ParagraphFeatureClientComponent = createClientComponent(ParagraphFeatureClient)
