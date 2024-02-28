'use client'

import { $getSelection, $isRangeSelection } from 'lexical'
import { $findMatchingParent } from 'lexical/LexicalUtils'

import type { LinkFields } from './nodes/LinkNode'

import { useLexicalFeature } from '../../../useLexicalFeature'
import { getSelectedNode } from '../../lexical/utils/getSelectedNode'
import { FeaturesSectionWithEntries } from '../common/floatingSelectToolbarFeaturesButtonsSection'
import { AutoLinkNode } from './nodes/AutoLinkNode'
import { $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from './nodes/LinkNode'
import { TOGGLE_LINK_WITH_MODAL_COMMAND } from './plugins/floatingLinkEditor/LinkEditor/commands'
import { key } from './shared'

type LinkClientProps = {}
export const nodes = [LinkNode, AutoLinkNode]

const getLinkFeature = (props: LinkClientProps) => {
  return {
    feature: () => ({
      floatingSelectToolbar: {
        sections: [
          FeaturesSectionWithEntries([
            {
              ChildComponent: () =>
                // @ts-expect-error-next-line
                import('../../lexical/ui/icons/Link').then((module) => module.LinkIcon),
              isActive: ({ selection }) => {
                if ($isRangeSelection(selection)) {
                  const selectedNode = getSelectedNode(selection)
                  const linkParent = $findMatchingParent(selectedNode, $isLinkNode)
                  return linkParent != null
                }
                return false
              },
              key: 'link',
              label: `Link`,
              onClick: ({ editor, isActive }) => {
                if (!isActive) {
                  let selectedText = null
                  editor.getEditorState().read(() => {
                    selectedText = $getSelection().getTextContent()
                  })
                  const linkFields: LinkFields = {
                    doc: null,
                    linkType: 'custom',
                    newTab: false,
                    url: 'https://',
                  }
                  editor.dispatchCommand(TOGGLE_LINK_WITH_MODAL_COMMAND, {
                    fields: linkFields,
                    text: selectedText,
                  })
                } else {
                  // remove link
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
                }
              },
              order: 1,
            },
          ]),
        ],
      },
      nodes,
      plugins: [
        {
          Component: () =>
            // @ts-expect-error-next-line
            import('./plugins/link').then((module) => module.LinkPlugin),
          position: 'normal',
        },
        {
          Component: () =>
            // @ts-expect-error-next-line
            import('./plugins/autoLink').then((module) => module.AutoLinkPlugin),
          position: 'normal',
        },
        {
          Component: () =>
            // @ts-expect-error-next-line
            import('./plugins/clickableLink').then((module) => module.ClickableLinkPlugin),
          position: 'normal',
        },
        {
          Component: () =>
            // @ts-expect-error-next-line
            import('./plugins/floatingLinkEditor').then((module) => {
              const floatingLinkEditorPlugin = module.FloatingLinkEditorPlugin
              return import('@payloadcms/ui').then((module) =>
                module.withMergedProps({
                  Component: floatingLinkEditorPlugin,
                  toMergeIntoProps: props,
                }),
              )
            }),
          position: 'floatingAnchorElem',
        },
      ],
    }),
  }
}

export const LinkFeatureClientComponent: React.FC<LinkClientProps> = (props) => {
  useLexicalFeature(key, getLinkFeature(props))

  return null
}
