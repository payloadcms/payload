'use client'

import type { BaseSelection, EditorConfig, RangeSelection, SerializedTextNode } from 'lexical'

import {
  $applyNodeReplacement,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $isTokenOrSegmented,
  TextNode,
} from 'lexical'

import type { ToolbarDropdownGroup, ToolbarGroup } from '../toolbars/types.js'
import type { TextClassesFeatureProps } from './feature.server.js'

import { TextColorIcon } from '../../lexical/ui/icons/TextColor/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'

const toolbarGroups = ({ settings }: TextClassesFeatureProps): ToolbarGroup[] => {
  const attributeSetting = settings[0]
  const items: ToolbarDropdownGroup['items'] = attributeSetting.classSuffixes.map((classSuffix) => {
    return {
      ChildComponent: TextColorIcon,
      key: classSuffix,
      label: classSuffix,
      onSelect: ({ editor }) => {
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) {
            return
          }
          $patchClassesText(selection, { [attributeSetting.classPrefix]: classSuffix })
        })
      },
      order: 1,
    }
  })
  return [
    {
      type: 'dropdown',
      ChildComponent: TextColorIcon,
      items,
      key: 'textClasses',
      order: 30,
    },
  ]
}

export const TextClassesFeatureClient = createClientFeature<TextClassesFeatureProps>(
  ({ props }) => {
    return {
      nodes: [
        Text1,
        { replace: TextNode, with: (node) => new Text1(node.__text), withKlass: Text1 },
        Text2,
        { replace: Text1, with: (node) => new Text2(node.__text), withKlass: Text2 },
      ],
      toolbarFixed: {
        groups: toolbarGroups(props),
      },
      toolbarInline: {
        groups: toolbarGroups(props),
      },
    }
  },
)

class Text1 extends TextNode {
  /**
   *
   */
  classes?: { [classSuffix: string]: string }

  static clone(node: Text1) {
    const clonedNode = new Text1(node.__text, node.__key)
    clonedNode.classes = node.classes
    return clonedNode
  }

  static getType() {
    return 'text1' //TextNode.getType()
  }

  static importJSON(serializedNode: SerializedTextNode): TextNode {
    return new Text1(serializedNode.text)
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config)
    // add classes to the text node
    if (this.classes) {
      Object.entries(this.classes).forEach(([classSuffix, className]) => {
        dom.classList.add(`${classSuffix}-${className}`)
      })
    }

    return dom
  }

  exportJSON(): SerializedTextNode {
    return {
      ...super.exportJSON(),
      type: Text1.getType(),
      // if is defined, add classes to the JSON
      ...(this.classes && { classes: this.classes }),
    }
  }
}

class Text2 extends Text1 {
  propertyNew = 'new'

  static clone(node: Text2) {
    return new Text2(node.__text, node.__key)
  }

  static getType(): string {
    return 'text2'
  }

  static importJSON(serializedNode: SerializedTextNode): TextNode {
    return new Text2(serializedNode.text)
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config)
    dom.style.textDecoration = 'underline'
    dom.style.textDecorationStyle = 'dashed'
    dom.style.textUnderlineOffset = '5px'

    return dom
  }

  exportJSON(): SerializedTextNode {
    return {
      ...super.exportJSON(),
      type: Text2.getType(),
    }
  }
}

// The following code is inspired and adapted from $patchStyleText (from Lexical).
function $patchClasses(target: Text1, patch: Record<string, string>): void {
  target.classes = { ...target.classes, ...patch }
}

/**
 * Applies the provided styles to the TextNodes in the provided Selection.
 * Will update partially selected TextNodes by splitting the TextNode and applying
 * the styles to the appropriate one.
 * @param selection - The selected node(s) to update.
 * @param patch - The patch to apply, which can include multiple styles. \\{CSSProperty: value\\} . Can also accept a function that returns the new property value.
 */
export function $patchClassesText(selection: BaseSelection, patch: Record<string, string>): void {
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
        $patchClasses(firstNode, patch)
        firstNode.select(startOffset, endOffset)
      } else {
        // The node is partially selected, so split it into two nodes
        // and style the selected one.
        const splitNodes = firstNode.splitText(startOffset, endOffset)
        const replacement = startOffset === 0 ? splitNodes[0] : splitNodes[1]
        $patchClasses(replacement, patch)
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

      $patchClasses(firstNode as TextNode, patch)
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
        $patchClasses(lastNode as TextNode, patch)
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
        $patchClasses(selectedNode, patch)
      }
    }
  }
}
