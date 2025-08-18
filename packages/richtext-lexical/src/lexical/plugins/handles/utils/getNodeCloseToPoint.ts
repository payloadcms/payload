'use client'
import type { LexicalEditor, LexicalNode } from 'lexical'

import { $getNodeByKey } from 'lexical'

import { Point } from '../../../utils/point.js'
import { Rect } from '../../../utils/rect.js'
import { getBoundingClientRectWithoutTransform } from '../DraggableBlockPlugin/getBoundingRectWithoutTransform.js'
import { getCollapsedMargins } from '../utils/getCollapsedMargins.js'
import { getTopLevelNodeKeys } from '../utils/getTopLevelNodeKeys.js'

// Directions
const Downward = 1
const Upward = -1
const Indeterminate = 0

type Props = {
  anchorElem: HTMLElement
  cache_threshold?: number
  editor: LexicalEditor
  /** fuzzy makes the search not exact. If no exact match found, find the closes node instead of returning null */
  fuzzy?: boolean
  horizontalOffset?: number
  point: Point
  /**
   * By default, empty paragraphs are not returned. Set this to true to return empty paragraphs. @default false
   */
  returnEmptyParagraphs?: boolean
  /**
   * The index to start searching from. It can be a considerable performance optimization to start searching from the index of the
   * previously found node, as the node is likely to be close to the next node.
   */
  startIndex?: number
  useEdgeAsDefault?: boolean
  verbose?: boolean
}

type Output = {
  blockElem: HTMLElement | null
  blockNode: LexicalNode | null
  foundAtIndex: number
  isFoundNodeEmptyParagraph: boolean
}

const cache = {
  props: null as null | Props,
  result: null as null | Output,
}

function isPointClose(previous: Point, current: Point, threshold: number = 20): boolean {
  const dx = previous.x - current.x
  const dy = previous.y - current.y
  return dx * dx + dy * dy <= threshold * threshold
}

export function getNodeCloseToPoint(props: Props): Output {
  const {
    anchorElem,
    cache_threshold = 20,
    editor,
    fuzzy = false,
    horizontalOffset = 0,
    point: { x, y },
    startIndex = 0,
    useEdgeAsDefault = false,
  } = props

  // Use cache
  if (
    cache_threshold > 0 &&
    cache.props &&
    cache.result &&
    cache.props.fuzzy === props.fuzzy &&
    cache.props.horizontalOffset === props.horizontalOffset &&
    cache.props.useEdgeAsDefault === props.useEdgeAsDefault &&
    isPointClose(cache.props.point, props.point, cache_threshold)
  ) {
    return cache.result
  }

  const anchorElementRect = anchorElem.getBoundingClientRect()
  const topLevelNodeKeys = getTopLevelNodeKeys(editor)

  const closestBlockElem: {
    blockElem: HTMLElement | null
    blockNode: LexicalNode | null
    distance: number
    foundAtIndex: number
    isFoundNodeEmptyParagraph: boolean
  } = {
    blockElem: null,
    blockNode: null,
    distance: Infinity,
    foundAtIndex: -1,
    isFoundNodeEmptyParagraph: false,
  }

  // Return null if matching block element is the first or last node
  editor.getEditorState().read(() => {
    if (useEdgeAsDefault) {
      const firstNode = editor.getElementByKey(topLevelNodeKeys[0]!)
      const lastNode = editor.getElementByKey(topLevelNodeKeys[topLevelNodeKeys.length - 1]!)

      if (firstNode && lastNode) {
        const [firstNodeRect, lastNodeRect] = [
          getBoundingClientRectWithoutTransform(firstNode),
          getBoundingClientRectWithoutTransform(lastNode),
        ]

        if (y < firstNodeRect.top) {
          closestBlockElem.blockElem = firstNode
          closestBlockElem.distance = firstNodeRect.top - y
          closestBlockElem.blockNode = $getNodeByKey(topLevelNodeKeys[0]!)
          closestBlockElem.foundAtIndex = 0
        } else if (y > lastNodeRect.bottom) {
          closestBlockElem.distance = y - lastNodeRect.bottom
          closestBlockElem.blockNode = $getNodeByKey(topLevelNodeKeys[topLevelNodeKeys.length - 1]!)
          closestBlockElem.blockElem = lastNode
          closestBlockElem.foundAtIndex = topLevelNodeKeys.length - 1
        }

        if (closestBlockElem?.blockElem) {
          return {
            blockElem: null,
            isFoundNodeEmptyParagraph: false,
          } as Output
        }
      }
    }

    // Find matching block element
    let index = startIndex
    let direction = Indeterminate

    while (index >= 0 && index < topLevelNodeKeys.length) {
      const key = topLevelNodeKeys[index]!
      const elem = editor.getElementByKey(key)
      if (elem === null) {
        break
      }
      const point = new Point(x + horizontalOffset, y)
      //const domRect = Rect.fromDOM(elem)
      // Do not consider transform of blocks when calculating distance
      const domRect = Rect.fromDOMRect(getBoundingClientRectWithoutTransform(elem))

      const { marginBottom, marginTop } = getCollapsedMargins(elem)

      const rect = domRect.generateNewRect({
        bottom: domRect.bottom + marginBottom,
        left: anchorElementRect.left,
        right: anchorElementRect.right,
        top: domRect.top - marginTop,
      })

      const { distance, isOnBottomSide, isOnTopSide } = rect.distanceFromPoint(point)

      if (distance === 0) {
        closestBlockElem.blockElem = elem
        closestBlockElem.blockNode = $getNodeByKey(key)
        closestBlockElem.foundAtIndex = index
        closestBlockElem.distance = distance

        // Check if blockNode is an empty text node
        if (
          closestBlockElem.blockNode &&
          closestBlockElem.blockNode.getType() === 'paragraph' &&
          closestBlockElem.blockNode.getTextContent() === ''
        ) {
          if (!fuzzy && !props.returnEmptyParagraphs) {
            closestBlockElem.blockElem = null
            closestBlockElem.blockNode = null
          }

          closestBlockElem.isFoundNodeEmptyParagraph = true
        }
        break
      } else if (fuzzy) {
        if (distance < closestBlockElem.distance) {
          closestBlockElem.blockElem = elem
          closestBlockElem.blockNode = $getNodeByKey(key)
          closestBlockElem.distance = distance
          closestBlockElem.foundAtIndex = index
        }
      }

      if (direction === Indeterminate) {
        if (isOnTopSide) {
          direction = Upward
        } else if (isOnBottomSide) {
          direction = Downward
        } else {
          // stop search block element
          direction = Infinity
        }
      }

      index += direction
    }
  })

  // Store in cache before returning
  cache.props = props
  cache.result = {
    blockElem: closestBlockElem.blockElem,
    blockNode: closestBlockElem.blockNode,
    foundAtIndex: closestBlockElem.foundAtIndex,
    isFoundNodeEmptyParagraph: closestBlockElem.isFoundNodeEmptyParagraph,
  }

  return {
    blockElem: closestBlockElem.blockElem,
    blockNode: closestBlockElem.blockNode,
    foundAtIndex: closestBlockElem.foundAtIndex,
    isFoundNodeEmptyParagraph: closestBlockElem.isFoundNodeEmptyParagraph,
  }
}
