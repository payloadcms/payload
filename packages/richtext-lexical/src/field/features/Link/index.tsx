import type { i18n } from 'i18next'
import type { SanitizedConfig } from 'payload/config'
import type { Field } from 'payload/types'

import LexicalClickableLinkPlugin from '@lexical/react/LexicalClickableLinkPlugin'
import { $findMatchingParent } from '@lexical/utils'
import { $getSelection, $isRangeSelection } from 'lexical'
import { withMergedProps } from 'payload/utilities'

import type { HTMLConverter } from '../converters/html/converter/types'
import type { FeatureProvider } from '../types'
import type { SerializedAutoLinkNode } from './nodes/AutoLinkNode'
import type { LinkFields, SerializedLinkNode } from './nodes/LinkNode'

import { LinkIcon } from '../../lexical/ui/icons/Link'
import { getSelectedNode } from '../../lexical/utils/getSelectedNode'
import { FeaturesSectionWithEntries } from '../common/floatingSelectToolbarFeaturesButtonsSection'
import { convertLexicalNodesToHTML } from '../converters/html/converter'
import './index.scss'
import { AutoLinkNode } from './nodes/AutoLinkNode'
import { $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from './nodes/LinkNode'
import { AutoLinkPlugin } from './plugins/autoLink'
import { FloatingLinkEditorPlugin } from './plugins/floatingLinkEditor'
import { TOGGLE_LINK_WITH_MODAL_COMMAND } from './plugins/floatingLinkEditor/LinkEditor'
import { LinkPlugin } from './plugins/link'
import { linkPopulationPromiseHOC } from './populationPromise'

export type LinkFeatureProps = {
  fields?:
    | ((args: { config: SanitizedConfig; defaultFields: Field[]; i18n: i18n }) => Field[])
    | Field[]
}
export const LinkFeature = (props: LinkFeatureProps): FeatureProvider => {
  return {
    feature: () => {
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
        nodes: [
          {
            converters: {
              html: {
                converter: ({ converters, node }) => {
                  const childrenText = convertLexicalNodesToHTML({
                    converters,
                    lexicalNodes: node.children,
                    parentNodeType: LinkNode.getType(),
                  })

                  const rel: string = node.fields.newTab ? ' rel="noopener noreferrer"' : ''

                  const href: string =
                    node.fields.linkType === 'custom' ? node.fields.url : node.fields.doc?.value?.id

                  return `<a href="${href}"${rel}>${childrenText}</a>`
                },
                nodeTypes: [LinkNode.getType()],
              } as HTMLConverter<SerializedLinkNode>,
            },
            node: LinkNode,
            populationPromises: [linkPopulationPromiseHOC(props)],
            type: LinkNode.getType(),
            // TODO: Add validation similar to upload for internal links and fields
          },
          {
            converters: {
              html: {
                converter: ({ converters, node }) => {
                  const childrenText = convertLexicalNodesToHTML({
                    converters,
                    lexicalNodes: node.children,
                    parentNodeType: AutoLinkNode.getType(),
                  })

                  const rel: string = node.fields.newTab ? ' rel="noopener noreferrer"' : ''

                  const href: string =
                    node.fields.linkType === 'custom' ? node.fields.url : node.fields.doc?.value?.id

                  return `<a href="${href}"${rel}>${childrenText}</a>`
                },
                nodeTypes: [AutoLinkNode.getType()],
              } as HTMLConverter<SerializedAutoLinkNode>,
            },
            node: AutoLinkNode,
            populationPromises: [linkPopulationPromiseHOC(props)],
            type: AutoLinkNode.getType(),
          },
        ],
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
            Component: withMergedProps({
              Component: FloatingLinkEditorPlugin,
              toMergeIntoProps: props,
            }),
            position: 'floatingAnchorElem',
          },
        ],
        props,
      }
    },
    key: 'link',
  }
}
