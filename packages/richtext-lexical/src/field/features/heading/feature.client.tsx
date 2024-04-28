'use client'

import type { HeadingTagType } from '@lexical/rich-text'

import { $createHeadingNode, HeadingNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $getSelection } from 'lexical'

import type { FeatureProviderProviderClient } from '../types.js'
import type { HeadingFeatureProps } from './feature.server.js'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'
import { H1Icon } from '../../lexical/ui/icons/H1/index.js'
import { H2Icon } from '../../lexical/ui/icons/H2/index.js'
import { H3Icon } from '../../lexical/ui/icons/H3/index.js'
import { H4Icon } from '../../lexical/ui/icons/H4/index.js'
import { H5Icon } from '../../lexical/ui/icons/H5/index.js'
import { H6Icon } from '../../lexical/ui/icons/H6/index.js'
import { TextDropdownSectionWithEntries } from '../common/floatingSelectToolbarTextDropdownSection/index.js'
import { createClientComponent } from '../createClientComponent.js'
import { MarkdownTransformer } from './markdownTransformer.js'

const setHeading = (headingSize: HeadingTagType) => {
  const selection = $getSelection()
  $setBlocksType(selection, () => $createHeadingNode(headingSize))
}

const iconImports = {
  h1: H1Icon,
  h2: H2Icon,
  h3: H3Icon,
  h4: H4Icon,
  h5: H5Icon,
  h6: H6Icon,
}

const HeadingFeatureClient: FeatureProviderProviderClient<HeadingFeatureProps> = (props) => {
  const { enabledHeadingSizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] } = props

  return {
    clientFeatureProps: props,
    feature: () => {
      return {
        clientFeatureProps: props,
        floatingSelectToolbar: {
          sections: [
            ...enabledHeadingSizes.map((headingSize, i) =>
              TextDropdownSectionWithEntries([
                {
                  ChildComponent: iconImports[headingSize],
                  isActive: () => false,
                  key: headingSize,
                  label: `Heading ${headingSize.charAt(1)}`,
                  onClick: ({ editor }) => {
                    editor.update(() => {
                      setHeading(headingSize)
                    })
                  },
                  order: i + 2,
                },
              ]),
            ),
          ],
        },
        markdownTransformers: [MarkdownTransformer(enabledHeadingSizes)],
        nodes: [HeadingNode],
        slashMenu: {
          options: [
            ...enabledHeadingSizes.map((headingSize) => {
              return {
                displayName: 'Basic',
                key: 'basic',
                options: [
                  new SlashMenuOption(`heading-${headingSize.charAt(1)}`, {
                    Icon: iconImports[headingSize],
                    displayName: `Heading ${headingSize.charAt(1)}`,
                    keywords: ['heading', headingSize],
                    onSelect: () => {
                      setHeading(headingSize)
                    },
                  }),
                ],
              }
            }),
          ],
        },
      }
    },
  }
}

export const HeadingFeatureClientComponent = createClientComponent(HeadingFeatureClient)
