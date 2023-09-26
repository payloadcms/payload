import LexicalClickableLinkPlugin from '@lexical/react/LexicalClickableLinkPlugin'

import type { FeatureProvider } from '../types'
import type { LinkAttributes } from './nodes/LinkNode'

import { LinkIcon } from '../../lexical/ui/icons/Link'
import { FeaturesSectionWithEntries } from '../common/floatingSelectToolbarFeaturesButtonsSection'
import { FloatingLinkEditorPlugin } from './floatingLinkEditor'
import './index.scss'
import { AutoLinkNode } from './nodes/AutoLinkNode'
import { LinkNode, TOGGLE_LINK_COMMAND } from './nodes/LinkNode'
import { AutoLinkPlugin } from './plugins/autoLink'
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
                isActive: ({ editor, selection }) => false,
                key: 'link',
                label: `Link`,
                onClick: ({ editor }) => {
                  const linkAttributes: LinkAttributes = {
                    linkType: 'custom',
                    url: 'https://',
                  }
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkAttributes)
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
