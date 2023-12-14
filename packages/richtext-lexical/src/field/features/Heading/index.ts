import type { HeadingTagType, SerializedHeadingNode } from '@lexical/rich-text'

import { $createHeadingNode, HeadingNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $INTERNAL_isPointSelection, $getSelection } from 'lexical'

import type { HTMLConverter } from '../converters/html/converter/types'
import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { basicSlashMenuGroup } from '../common/basicSlashMenuGroup'
import { TextDropdownSectionWithEntries } from '../common/floatingSelectToolbarTextDropdownSection'
import { convertLexicalNodesToHTML } from '../converters/html/converter'
import { MarkdownTransformer } from './markdownTransformer'
import { translationsClient } from './translations'

const setHeading = (headingSize: HeadingTagType) => {
  const selection = $getSelection()
  if ($INTERNAL_isPointSelection(selection)) {
    $setBlocksType(selection, () => $createHeadingNode(headingSize))
  }
}

type Props = {
  enabledHeadingSizes?: HeadingTagType[]
}

const iconImports = {
  // @ts-expect-error
  h1: () => import('../../lexical/ui/icons/H1').then((module) => module.H1Icon),
  // @ts-expect-error
  h2: () => import('../../lexical/ui/icons/H2').then((module) => module.H2Icon),
  // @ts-expect-error
  h3: () => import('../../lexical/ui/icons/H3').then((module) => module.H3Icon),
  // @ts-expect-error
  h4: () => import('../../lexical/ui/icons/H4').then((module) => module.H4Icon),
  // @ts-expect-error
  h5: () => import('../../lexical/ui/icons/H5').then((module) => module.H5Icon),
  // @ts-expect-error
  h6: () => import('../../lexical/ui/icons/H6').then((module) => module.H6Icon),
}

export const HeadingFeature = (props: Props): FeatureProvider => {
  const { enabledHeadingSizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] } = props

  return {
    feature: () => {
      return {
        floatingSelectToolbar: {
          sections: [
            ...enabledHeadingSizes.map((headingSize, i) =>
              TextDropdownSectionWithEntries([
                {
                  ChildComponent: iconImports[headingSize],
                  isActive: () => false,
                  key: headingSize,
                  label: ({ i18n }) =>
                    i18n.t('lexical:heading:label', { headingLevel: headingSize.charAt(1) }),
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
        i18nClient: translationsClient,
        markdownTransformers: [MarkdownTransformer(enabledHeadingSizes)],
        nodes: [
          {
            converters: {
              html: {
                converter: async ({ converters, node, parent }) => {
                  const childrenText = await convertLexicalNodesToHTML({
                    converters,
                    lexicalNodes: node.children,
                    parent: {
                      ...node,
                      parent,
                    },
                  })

                  return '<' + node?.tag + '>' + childrenText + '</' + node?.tag + '>'
                },
                nodeTypes: [HeadingNode.getType()],
              } as HTMLConverter<SerializedHeadingNode>,
            },
            node: HeadingNode,
            type: HeadingNode.getType(),
          },
        ],
        props,
        slashMenu: {
          options: [
            ...enabledHeadingSizes.map((headingSize) => {
              return {
                ...basicSlashMenuGroup,
                options: [
                  new SlashMenuOption(`heading-${headingSize.charAt(1)}`, {
                    Icon: iconImports[headingSize],
                    keywords: ['heading', headingSize],
                    label: ({ i18n }) =>
                      i18n.t('lexical:heading:label', { headingLevel: headingSize.charAt(1) }),
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
    key: 'heading',
  }
}
