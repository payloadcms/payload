import type { BaseSelection, Klass, LexicalNode, LexicalNodeReplacement } from 'lexical'

import { $isTextNode, $isTokenOrSegmented } from 'lexical'

import type { NodeWithHooks } from '../../features/typesServer.js'
import type { SanitizedClientEditorConfig, SanitizedServerEditorConfig } from '../config/types.js'
import type { TextNode } from './TextNode.js'

export function getEnabledNodes({
  editorConfig,
}: {
  editorConfig: SanitizedClientEditorConfig | SanitizedServerEditorConfig
}): Array<Klass<LexicalNode> | LexicalNodeReplacement> {
  return getEnabledNodesFromServerNodes({
    nodes: editorConfig.features.nodes,
  })
}

export function getEnabledNodesFromServerNodes({
  nodes,
}: {
  nodes: Array<Klass<LexicalNode> | LexicalNodeReplacement> | Array<NodeWithHooks>
}): Array<Klass<LexicalNode> | LexicalNodeReplacement> {
  return nodes.map((node) => {
    if ('node' in node) {
      return node.node
    }
    return node
  })
}

/**
 * Will update partially selected TextNodes by splitting the TextNode and applying
 * the callback to the appropriate one.
 * @param selection - The selected node(s) to update.
 * @param fn - The callback to apply to the selected TextNodes.
 */
export function $mutateSelectedTextNodes(
  selection: BaseSelection,
  fn: (textNode: TextNode) => void,
): void {
  const selectedNodes = selection.getNodes()
  const selectedNodesLength = selectedNodes.length
  const anchorAndFocus = selection.getStartEndPoints()
  if (anchorAndFocus === null) {
    return
  }
  const [anchor, focus] = anchorAndFocus

  const lastIndex = selectedNodesLength - 1
  let firstNode = selectedNodes[0]
  let lastNode = selectedNodes[lastIndex]

  const firstNodeText = firstNode.getTextContent()
  const firstNodeTextLength = firstNodeText.length
  const focusOffset = focus.offset
  let anchorOffset = anchor.offset
  const isBefore = anchor.isBefore(focus)
  let startOffset = isBefore ? anchorOffset : focusOffset
  let endOffset = isBefore ? focusOffset : anchorOffset
  const startType = isBefore ? anchor.type : focus.type
  const endType = isBefore ? focus.type : anchor.type
  const endKey = isBefore ? focus.key : anchor.key

  // This is the case where the user only selected the very end of the
  // first node so we don't want to include it in the formatting change.
  if ($isTextNode(firstNode) && startOffset === firstNodeTextLength) {
    const nextSibling = firstNode.getNextSibling()

    if ($isTextNode(nextSibling)) {
      // we basically make the second node the firstNode, changing offsets accordingly
      anchorOffset = 0
      startOffset = 0
      firstNode = nextSibling
    }
  }

  // This is the case where we only selected a single node
  if (selectedNodes.length === 1) {
    if ($isTextNode(firstNode) && firstNode.canHaveFormat()) {
      startOffset =
        startType === 'element' ? 0 : anchorOffset > focusOffset ? focusOffset : anchorOffset
      endOffset =
        endType === 'element'
          ? firstNodeTextLength
          : anchorOffset > focusOffset
            ? anchorOffset
            : focusOffset

      // No actual text is selected, so do nothing.
      if (startOffset === endOffset) {
        return
      }

      // The entire node is selected or a token/segment, so just format it
      if (
        $isTokenOrSegmented(firstNode) ||
        (startOffset === 0 && endOffset === firstNodeTextLength)
      ) {
        fn(firstNode as TextNode)
        firstNode.select(startOffset, endOffset)
      } else {
        // The node is partially selected, so split it into two nodes
        // and style the selected one.
        const splitNodes = firstNode.splitText(startOffset, endOffset)
        const replacement = startOffset === 0 ? splitNodes[0] : splitNodes[1]
        fn(replacement as TextNode)
        replacement.select(0, endOffset - startOffset)
      }
    } // multiple nodes selected.
  } else {
    if (
      $isTextNode(firstNode) &&
      startOffset < firstNode.getTextContentSize() &&
      firstNode.canHaveFormat()
    ) {
      if (startOffset !== 0 && !$isTokenOrSegmented(firstNode)) {
        // the entire first node isn't selected and it isn't a token or segmented, so split it
        firstNode = firstNode.splitText(startOffset)[1]
        startOffset = 0
        if (isBefore) {
          anchor.set(firstNode.getKey(), startOffset, 'text')
        } else {
          focus.set(firstNode.getKey(), startOffset, 'text')
        }
      }

      fn(firstNode as TextNode)
    }

    if ($isTextNode(lastNode) && lastNode.canHaveFormat()) {
      const lastNodeText = lastNode.getTextContent()
      const lastNodeTextLength = lastNodeText.length

      // The last node might not actually be the end node
      //
      // If not, assume the last node is fully-selected unless the end offset is
      // zero.
      if (lastNode.__key !== endKey && endOffset !== 0) {
        endOffset = lastNodeTextLength
      }

      // if the entire last node isn't selected and it isn't a token or segmented, split it
      if (endOffset !== lastNodeTextLength && !$isTokenOrSegmented(lastNode)) {
        ;[lastNode] = lastNode.splitText(endOffset)
      }

      if (endOffset !== 0 || endType === 'element') {
        fn(lastNode as TextNode)
      }
    }

    // style all the text nodes in between
    for (let i = 1; i < lastIndex; i++) {
      const selectedNode = selectedNodes[i]
      const selectedNodeKey = selectedNode.getKey()

      if (
        $isTextNode(selectedNode) &&
        selectedNode.canHaveFormat() &&
        selectedNodeKey !== firstNode.getKey() &&
        selectedNodeKey !== lastNode.getKey() &&
        !selectedNode.isToken()
      ) {
        fn(selectedNode as TextNode)
      }
    }
  }
}
