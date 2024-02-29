'use client'

import { $findMatchingParent } from '@lexical/utils'
import { $getSelection, $isRangeSelection } from 'lexical'

import type { FeatureProviderProviderClient } from '../types'
import type { ExclusiveLinkCollectionsProps } from './feature.server'
import type { LinkFields } from './nodes/types'

import { LinkIcon } from '../../lexical/ui/icons/Link'
import { getSelectedNode } from '../../lexical/utils/getSelectedNode'
import { FeaturesSectionWithEntries } from '../common/floatingSelectToolbarFeaturesButtonsSection'
import { createClientComponent } from '../createClientComponent'
import { AutoLinkNode } from './nodes/AutoLinkNode'
import { $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from './nodes/LinkNode'
import { AutoLinkPlugin } from './plugins/autoLink'
import { ClickableLinkPlugin } from './plugins/clickableLink'
import { FloatingLinkEditorPlugin } from './plugins/floatingLinkEditor'
import { TOGGLE_LINK_WITH_MODAL_COMMAND } from './plugins/floatingLinkEditor/LinkEditor/commands'
import { LinkPlugin } from './plugins/link'

export type ClientProps = ExclusiveLinkCollectionsProps

const LinkFeatureClient: FeatureProviderProviderClient<ClientProps> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      floatingSelectToolbar: {
        sections: [
          FeaturesSectionWithEntries([
            {
              ChildComponent: LinkIcon,
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
      nodes: [LinkNode, AutoLinkNode],
      plugins: [
        {
          Component: LinkPlugin,
          position: 'normal',
        },
        {
          Component: AutoLinkPlugin,
          position: 'normal',
        },
        {
          Component: ClickableLinkPlugin,
          position: 'normal',
        },
        {
          Component: FloatingLinkEditorPlugin,
          position: 'floatingAnchorElem',
        },
      ],
    }),
  }
}

export const LinkFeatureClientComponent = createClientComponent(LinkFeatureClient)
