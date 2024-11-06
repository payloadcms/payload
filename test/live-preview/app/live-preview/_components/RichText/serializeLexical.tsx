import type {
  LinkFields,
  SerializedHeadingNode,
  SerializedLinkNode,
  SerializedListItemNode,
  SerializedListNode,
  SerializedUploadNode,
} from '@payloadcms/richtext-lexical'
import type {
  SerializedEditorState,
  SerializedElementNode,
  SerializedLexicalNode,
  SerializedTextNode,
} from 'lexical'
import type { JSX } from 'react'

import {
  IS_BOLD,
  IS_CODE,
  IS_ITALIC,
  IS_STRIKETHROUGH,
  IS_SUBSCRIPT,
  IS_SUPERSCRIPT,
  IS_UNDERLINE,
} from 'lexical'
import React, { Fragment } from 'react'
import ReactDOMServer from 'react-dom/server'

import { CMSLink } from '../Link/index.js'
import { Media } from '../Media/index.js'

function serializer(nodes: SerializedLexicalNode[]): JSX.Element {
  return (
    <Fragment>
      {nodes?.map((_node, index): JSX.Element | null => {
        if (_node.type === 'text') {
          const node = _node as SerializedTextNode
          let text = <React.Fragment key={index}>{node.text}</React.Fragment>
          if (node.format & IS_BOLD) {
            text = <strong key={index}>{text}</strong>
          }
          if (node.format & IS_ITALIC) {
            text = <em key={index}>{text}</em>
          }
          if (node.format & IS_STRIKETHROUGH) {
            text = (
              <span key={index} style={{ textDecoration: 'line-through' }}>
                {text}
              </span>
            )
          }
          if (node.format & IS_UNDERLINE) {
            text = (
              <span key={index} style={{ textDecoration: 'underline' }}>
                {text}
              </span>
            )
          }
          if (node.format & IS_CODE) {
            text = <code key={index}>{node.text}</code>
          }
          if (node.format & IS_SUBSCRIPT) {
            text = <sub key={index}>{text}</sub>
          }
          if (node.format & IS_SUPERSCRIPT) {
            text = <sup key={index}>{text}</sup>
          }

          return text
        }

        if (_node == null) {
          return null
        }

        // NOTE: Hacky fix for
        // https://github.com/facebook/lexical/blob/d10c4e6e55261b2fdd7d1845aed46151d0f06a8c/packages/lexical-list/src/LexicalListItemNode.ts#L133
        // which does not return checked: false (only true - i.e. there is no prop for false)
        const serializedChildrenFn = (node: SerializedElementNode): JSX.Element | null => {
          if (node.children == null) {
            return null
          } else {
            if (node?.type === 'list' && (node as SerializedListNode)?.listType === 'check') {
              for (const item of node.children) {
                if ('checked' in item) {
                  if (!item?.checked) {
                    item.checked = false
                  }
                }
              }
              return serializer(node.children)
            } else {
              return serializer(node.children)
            }
          }
        }

        const serializedChildren =
          'children' in _node ? serializedChildrenFn(_node as SerializedElementNode) : ''

        switch (_node.type) {
          case 'linebreak': {
            return <br key={index} />
          }
          case 'paragraph': {
            return <p key={index}>{serializedChildren}</p>
          }
          case 'heading': {
            const node = _node as SerializedHeadingNode

            type Heading = Extract<keyof JSX.IntrinsicElements, 'h1' | 'h2' | 'h3' | 'h4' | 'h5'>
            const Tag = node?.tag as Heading
            return <Tag key={index}>{serializedChildren}</Tag>
          }
          case 'list': {
            const node = _node as SerializedListNode

            type List = Extract<keyof JSX.IntrinsicElements, 'ol' | 'ul'>
            const Tag = node?.tag as List
            return (
              <Tag className="list" key={index}>
                {serializedChildren}
              </Tag>
            )
          }
          case 'listitem': {
            const node = _node as SerializedListItemNode

            if (node?.checked != null) {
              return (
                <li
                  aria-checked={node.checked ? 'true' : 'false'}
                  className={` ${node.checked ? '' : ''}`}
                  key={index}
                  // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
                  role="checkbox"
                  tabIndex={-1}
                  value={node?.value}
                >
                  {serializedChildren}
                </li>
              )
            } else {
              return (
                <li key={index} value={node?.value}>
                  {serializedChildren}
                </li>
              )
            }
          }
          case 'quote': {
            return <blockquote key={index}>{serializedChildren}</blockquote>
          }
          case 'link': {
            const node = _node as SerializedLinkNode

            const fields: LinkFields = node.fields

            return (
              <CMSLink
                key={index}
                newTab={Boolean(fields?.newTab)}
                reference={fields.doc as any}
                type={fields.linkType === 'internal' ? 'reference' : 'custom'}
                url={fields.url}
              >
                {serializedChildren}
              </CMSLink>
            )
          }
          case 'upload': {
            const node = _node as SerializedUploadNode
            return <Media key={index} resource={node?.value} />
          }

          /* case 'block': {
            // todo: fix types

            const block = _node.fields

            //@ts-expect-error
            const blockType = _node.fields?.blockType

            if (!block || !blockType) {
              return null
            }

            switch (blockType) {
              case 'content':
                return <ContentBlock {...block} />
              case 'cta':
                return <CallToActionBlock {...block} />
              case 'archive':
                return <ArchiveBlock {...block} />
              case 'mediaBlock':
                return <MediaBlock {...block} />
              case 'banner':
                return <BannerBlock {...block} />
              case 'code':
                return <CodeBlock {...block} />
              default:
                return null
            }
          } */

          default:
            return null
        }
      })}
    </Fragment>
  )
}

const serializeLexical = (
  content?: SerializedEditorState,
  renderUploadFilenameOnly?: boolean,
): React.ReactNode | React.ReactNode[] => {
  const result = serializer(content?.root?.children)
  const resultString = ReactDOMServer.renderToString(<>{result}</>)
  if (!resultString) {
    return null
  }
  console.log('Serialized lexical:', resultString)
  return result
}

export default serializeLexical
