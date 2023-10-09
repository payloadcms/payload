import type { HeadingTagType } from '@lexical/rich-text'
import type { LexicalEditor } from 'lexical'

import { $createHeadingNode, HeadingNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $getSelection, $isRangeSelection, DEPRECATED_$isGridSelection } from 'lexical'

import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'
import { H1Icon } from '../../lexical/ui/icons/H1'
import { H2Icon } from '../../lexical/ui/icons/H2'
import { H3Icon } from '../../lexical/ui/icons/H3'
import { H4Icon } from '../../lexical/ui/icons/H4'
import { H5Icon } from '../../lexical/ui/icons/H5'
import { H6Icon } from '../../lexical/ui/icons/H6'
import { TextDropdownSectionWithEntries } from '../common/floatingSelectToolbarTextDropdownSection'
import { MarkdownTransformer } from './markdownTransformer'

const setHeading = (editor: LexicalEditor, headingSize: HeadingTagType) => {
  const selection = $getSelection()
  if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
    $setBlocksType(selection, () => $createHeadingNode(headingSize))
  }
}

type Props = {
  enabledHeadingSizes?: HeadingTagType[]
}

const HeadingToIconMap: Record<HeadingTagType, React.FC> = {
  h1: H1Icon,
  h2: H2Icon,
  h3: H3Icon,
  h4: H4Icon,
  h5: H5Icon,
  h6: H6Icon,
}

export const HeadingFeature = (props: Props): FeatureProvider => {
  const { enabledHeadingSizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] } = props

  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        floatingSelectToolbar: {
          sections: [
            ...enabledHeadingSizes.map((headingSize, i) =>
              TextDropdownSectionWithEntries([
                {
                  ChildComponent: HeadingToIconMap[headingSize],
                  isActive: ({ editor, selection }) => false,
                  key: headingSize,
                  label: `Heading ${headingSize.charAt(1)}`,
                  onClick: ({ editor }) => {
                    editor.update(() => {
                      setHeading(editor, headingSize)
                    })
                  },
                  order: i + 2,
                },
              ]),
            ),
          ],
        },
        markdownTransformers: [MarkdownTransformer(enabledHeadingSizes)],
        nodes: [{ node: HeadingNode, type: HeadingNode.getType() }],
        props,
        slashMenu: {
          options: [
            ...enabledHeadingSizes.map((headingSize) => {
              return {
                options: [
                  new SlashMenuOption(`Heading ${headingSize.charAt(1)}`, {
                    Icon: HeadingToIconMap[headingSize],
                    keywords: ['heading', headingSize],
                    onSelect: ({ editor }) => {
                      setHeading(editor, headingSize)
                    },
                  }),
                ],
                title: 'Basic',
              }
            }),
          ],
        },
      }
    },
    key: 'heading',
  }
}
