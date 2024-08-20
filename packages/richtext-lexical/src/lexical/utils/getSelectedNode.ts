'use client'
import type { ElementNode, RangeSelection, TextNode } from 'lexical'

import { $isAtNodeEnd } from '@lexical/selection'

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
