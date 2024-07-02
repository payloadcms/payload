'use client'

import React, { useCallback } from 'react'
import { Editor, Element, Text, Transforms } from 'slate'
import { ReactEditor, useSlate } from 'slate-react'

import type { ElementNode } from '../../../types.js'

import { IndentLeft } from '../../icons/IndentLeft/index.js'
import { IndentRight } from '../../icons/IndentRight/index.js'
import { baseClass } from '../Button.js'
import { getCommonBlock } from '../getCommonBlock.js'
import { isElementActive } from '../isActive.js'
import { isBlockElement } from '../isBlockElement.js'
import { listTypes } from '../listTypes.js'
import { unwrapList } from '../unwrapList.js'
import { indentType } from './shared.js'

export const IndentButton: React.FC = () => {
  const editor = useSlate()
  const handleIndent = useCallback(
    (e, dir) => {
      e.preventDefault()

      if (dir === 'left') {
        if (isElementActive(editor, 'li')) {
          const [, listPath] = getCommonBlock(
            editor,
            (n) => Element.isElement(n) && listTypes.includes(n.type),
          )

          const matchedParentList = Editor.above(editor, {
            at: listPath,
            match: (n: ElementNode) => !Editor.isEditor(n) && isBlockElement(editor, n),
          })

          if (matchedParentList) {
            const [parentListItem, parentListItemPath] = matchedParentList

            if (parentListItem.children.length > 1) {
              // Remove nested list
              Transforms.unwrapNodes(editor, {
                at: parentListItemPath,
                match: (node, path) => {
                  const matches =
                    !Editor.isEditor(node) &&
                    Element.isElement(node) &&
                    listTypes.includes(node.type) &&
                    path.length === parentListItemPath.length + 1

                  return matches
                },
              })

              // Set li type on any children that don't have a type
              Transforms.setNodes(
                editor,
                { type: 'li' },
                {
                  at: parentListItemPath,
                  match: (node, path) => {
                    const matches =
                      !Editor.isEditor(node) &&
                      Element.isElement(node) &&
                      node.type !== 'li' &&
                      path.length === parentListItemPath.length + 1

                    return matches
                  },
                },
              )

              // Parent list item path has changed at this point
              // so we need to re-fetch the parent node
              const [newParentNode] = Editor.node(editor, parentListItemPath)

              // If the parent node is an li,
              // lift all li nodes within
              if (Element.isElement(newParentNode) && newParentNode.type === 'li') {
                // Lift the nested lis
                Transforms.liftNodes(editor, {
                  at: parentListItemPath,
                  match: (node, path) => {
                    const matches =
                      !Editor.isEditor(node) &&
                      Element.isElement(node) &&
                      path.length === parentListItemPath.length + 1 &&
                      node.type === 'li'

                    return matches
                  },
                })
              }
            } else {
              Transforms.unwrapNodes(editor, {
                at: parentListItemPath,
                match: (node, path) => {
                  return (
                    Element.isElement(node) &&
                    node.type === 'li' &&
                    path.length === parentListItemPath.length
                  )
                },
              })

              Transforms.unwrapNodes(editor, {
                match: (n) => Element.isElement(n) && listTypes.includes(n.type),
              })
            }
          } else {
            unwrapList(editor, listPath)
          }
        } else {
          Transforms.unwrapNodes(editor, {
            match: (n) => Element.isElement(n) && n.type === indentType,
            mode: 'lowest',
            split: true,
          })
        }
      }

      if (dir === 'right') {
        const isCurrentlyOL = isElementActive(editor, 'ol')
        const isCurrentlyUL = isElementActive(editor, 'ul')

        if (isCurrentlyOL || isCurrentlyUL) {
          // Get the path of the first selected li -
          // Multiple lis could be selected
          // and the selection may start in the middle of the first li
          const [[, firstSelectedLIPath]] = Array.from(
            Editor.nodes(editor, {
              match: (node) => Element.isElement(node) && node.type === 'li',
              mode: 'lowest',
            }),
          )

          // Is the first selected li the first in its list?
          const hasPrecedingLI = firstSelectedLIPath[firstSelectedLIPath.length - 1] > 0

          // If the first selected li is NOT the first in its list,
          // we need to inject it into the prior li
          if (hasPrecedingLI) {
            const [, precedingLIPath] = Editor.previous(editor, {
              at: firstSelectedLIPath,
            })

            const [precedingLIChildren] = Editor.node(editor, [...precedingLIPath, 0])
            const precedingLIChildrenIsText = Text.isText(precedingLIChildren)

            if (precedingLIChildrenIsText) {
              // Wrap the prior li text content so that it can be nested next to a list
              Transforms.wrapNodes(editor, { children: [] }, { at: [...precedingLIPath, 0] })
            }

            // Move the selected lis after the prior li contents
            Transforms.moveNodes(editor, {
              match: (node) => Element.isElement(node) && node.type === 'li',
              mode: 'lowest',
              to: [...precedingLIPath, 1],
            })

            // Wrap the selected lis in a new list
            Transforms.wrapNodes(
              editor,
              {
                type: isCurrentlyOL ? 'ol' : 'ul',
                children: [],
              },
              {
                match: (node) => Element.isElement(node) && node.type === 'li',
                mode: 'lowest',
              },
            )
          } else {
            // Otherwise, just wrap the node in a list / li
            Transforms.wrapNodes(
              editor,
              {
                type: isCurrentlyOL ? 'ol' : 'ul',
                children: [{ type: 'li', children: [] }],
              },
              {
                match: (node) => Element.isElement(node) && node.type === 'li',
                mode: 'lowest',
              },
            )
          }
        } else {
          Transforms.wrapNodes(editor, { type: indentType, children: [] })
        }
      }

      ReactEditor.focus(editor)
    },
    [editor],
  )

  const canDeIndent = isElementActive(editor, 'li') || isElementActive(editor, indentType)

  return (
    <React.Fragment>
      <button
        className={[baseClass, !canDeIndent && `${baseClass}--disabled`].filter(Boolean).join(' ')}
        onClick={canDeIndent ? (e) => handleIndent(e, 'left') : undefined}
        type="button"
      >
        <IndentLeft />
      </button>
      <button className={baseClass} onClick={(e) => handleIndent(e, 'right')} type="button">
        <IndentRight />
      </button>
    </React.Fragment>
  )
}
