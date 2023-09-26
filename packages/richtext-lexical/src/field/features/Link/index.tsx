import LexicalClickableLinkPlugin from '@lexical/react/LexicalClickableLinkPlugin'
import { $findMatchingParent } from '@lexical/utils'
import { $isRangeSelection } from 'lexical'

import type { FeatureProvider } from '../types'
import type { LinkAttributes } from './nodes/LinkNode'

import { LinkIcon } from '../../lexical/ui/icons/Link'
import { getSelectedNode } from '../../lexical/utils/getSelectedNode'
import { FeaturesSectionWithEntries } from '../common/floatingSelectToolbarFeaturesButtonsSection'
import './index.scss'
import { AutoLinkNode } from './nodes/AutoLinkNode'
import { $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from './nodes/LinkNode'
import { AutoLinkPlugin } from './plugins/autoLink'
import { FloatingLinkEditorPlugin } from './plugins/floatingLinkEditor'
import { LinkPlugin } from './plugins/link'

export const LinkFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        floatingSelectToolbar: {
          sections: [
            FeaturesSectionWithEntries([
              {
                ChildComponent: LinkIcon,
                isActive: ({ editor, selection }) => {
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
                    const linkAttributes: LinkAttributes = {
                      linkType: 'custom',
                      url: 'https://',
                    }
                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkAttributes)
                  } else {
                    // remove link
                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
                  }

                  //editor.dispatchCommand(OPEN_LINK_DRAWER_COMMAND, linkAttributes)
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
            Component: LexicalClickableLinkPlugin,
            position: 'normal',
          },
          {
            Component: FloatingLinkEditorPlugin,
            position: 'floatingAnchorElem',
          },
        ],
      }
    },
    key: 'link',
  }
}
