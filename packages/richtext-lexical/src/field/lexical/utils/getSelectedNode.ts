import { $isAtNodeEnd } from '@lexical/selection'
import { type ElementNode, type RangeSelection, type TextNode } from 'lexical'

export function getSelectedNode(selection: RangeSelection): ElementNode | TextNode {
  const { anchor } = selection
  const { focus } = selection
  const anchorNode = selection.anchor.getNode()
  const focusNode = selection.focus.getNode()
  if (anchorNode === focusNode) {
    return anchorNode
  }
  const isBackward = selection.isBackward()
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode
  }
  return $isAtNodeEnd(anchor) ? anchorNode : focusNode
}
