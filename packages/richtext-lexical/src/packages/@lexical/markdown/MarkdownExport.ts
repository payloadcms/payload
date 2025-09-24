/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ElementNode, LexicalNode, TextFormatType, TextNode } from 'lexical'

import { $getRoot, $isDecoratorNode, $isElementNode, $isLineBreakNode, $isTextNode } from 'lexical'

import type {
  ElementTransformer,
  MultilineElementTransformer,
  TextFormatTransformer,
  TextMatchTransformer,
  Transformer,
} from './MarkdownTransformers.js'

import { isEmptyParagraph, transformersByType } from './utils.js'

/**
 * Renders string from markdown. The selection is moved to the start after the operation.
 */
export function createMarkdownExport(
  transformers: Array<Transformer>,
  shouldPreserveNewLines: boolean = false,
): (node?: ElementNode) => string {
  const byType = transformersByType(transformers)
  const elementTransformers = [...byType.multilineElement, ...byType.element]
  const isNewlineDelimited = !shouldPreserveNewLines

  // Export only uses text formats that are responsible for single format
  // e.g. it will filter out *** (bold, italic) and instead use separate ** and *
  const textFormatTransformers = byType.textFormat
    .filter((transformer) => transformer.format.length === 1)
    // Make sure all text transformers that contain 'code' in their format are at the end of the array. Otherwise, formatted code like
    // <strong><code>code</code></strong> will be exported as `**Bold Code**`, as the code format will be applied first, and the bold format
    // will be applied second and thus skipped entirely, as the code format will prevent any further formatting.
    .sort((a, b) => {
      if (a.format.includes('code') && !b.format.includes('code')) {
        return 1
      } else if (!a.format.includes('code') && b.format.includes('code')) {
        return -1
      } else {
        return 0
      }
    })

  return (node) => {
    const output: string[] = []
    const children = (node || $getRoot()).getChildren()

    children.forEach((child, i) => {
      const result = exportTopLevelElements(
        child,
        elementTransformers,
        textFormatTransformers,
        byType.textMatch,
      )

      if (result != null) {
        output.push(
          // separate consecutive group of texts with a line break: eg. ["hello", "world"] -> ["hello", "/nworld"]
          isNewlineDelimited &&
            i > 0 &&
            !isEmptyParagraph(child) &&
            !isEmptyParagraph(children[i - 1]!)
            ? '\n'.concat(result)
            : result,
        )
      }
    })
    // Ensure consecutive groups of texts are at least \n\n apart while each empty paragraph render as a newline.
    // Eg. ["hello", "", "", "hi", "\nworld"] -> "hello\n\n\nhi\n\nworld"
    return output.join('\n')
  }
}

function exportTopLevelElements(
  node: LexicalNode,
  elementTransformers: Array<ElementTransformer | MultilineElementTransformer>,
  textTransformersIndex: Array<TextFormatTransformer>,
  textMatchTransformers: Array<TextMatchTransformer>,
): null | string {
  for (const transformer of elementTransformers) {
    if (!transformer.export) {
      continue
    }
    const result = transformer.export(node, (_node) =>
      exportChildren(_node, textTransformersIndex, textMatchTransformers),
    )

    if (result != null) {
      return result
    }
  }

  if ($isElementNode(node)) {
    return exportChildren(node, textTransformersIndex, textMatchTransformers)
  } else if ($isDecoratorNode(node)) {
    return node.getTextContent()
  } else {
    return null
  }
}

function exportChildren(
  node: ElementNode,
  textTransformersIndex: Array<TextFormatTransformer>,
  textMatchTransformers: Array<TextMatchTransformer>,
  unclosedTags?: Array<{ format: TextFormatType; tag: string }>,
  unclosableTags?: Array<{ format: TextFormatType; tag: string }>,
): string {
  const output = []
  const children = node.getChildren()
  // keep track of unclosed tags from the very beginning
  if (!unclosedTags) {
    unclosedTags = []
  }
  if (!unclosableTags) {
    unclosableTags = []
  }

  mainLoop: for (const child of children) {
    for (const transformer of textMatchTransformers) {
      if (!transformer.export) {
        continue
      }

      const result = transformer.export(
        child,
        (parentNode) =>
          exportChildren(
            parentNode,
            textTransformersIndex,
            textMatchTransformers,
            unclosedTags,
            // Add current unclosed tags to the list of unclosable tags - we don't want nested tags from
            // textmatch transformers to close the outer ones, as that may result in invalid markdown.
            // E.g. **text [text**](https://lexical.io)
            // is invalid markdown, as the closing ** is inside the link.
            //
            [...unclosableTags, ...unclosedTags],
          ),
        (textNode, textContent) =>
          exportTextFormat(
            textNode,
            textContent,
            textTransformersIndex,
            unclosedTags,
            unclosableTags,
          ),
      )

      if (result != null) {
        output.push(result)
        continue mainLoop
      }
    }

    if ($isLineBreakNode(child)) {
      output.push('\n')
    } else if ($isTextNode(child)) {
      output.push(
        exportTextFormat(
          child,
          child.getTextContent(),
          textTransformersIndex,
          unclosedTags,
          unclosableTags,
        ),
      )
    } else if ($isElementNode(child)) {
      // empty paragraph returns ""
      output.push(
        exportChildren(
          child,
          textTransformersIndex,
          textMatchTransformers,
          unclosedTags,
          unclosableTags,
        ),
      )
    } else if ($isDecoratorNode(child)) {
      output.push(child.getTextContent())
    }
  }

  return output.join('')
}

function exportTextFormat(
  node: TextNode,
  textContent: string,
  textTransformers: Array<TextFormatTransformer>,
  // unclosed tags include the markdown tags that haven't been closed yet, and their associated formats
  unclosedTags: Array<{ format: TextFormatType; tag: string }>,
  unclosableTags?: Array<{ format: TextFormatType; tag: string }>,
): string {
  // This function handles the case of a string looking like this: "   foo   "
  // Where it would be invalid markdown to generate: "**   foo   **"
  // We instead want to trim the whitespace out, apply formatting, and then
  // bring the whitespace back. So our returned string looks like this: "   **foo**   "
  const frozenString = textContent.trim()
  let output = frozenString

  if (!node.hasFormat('code')) {
    // Escape any markdown characters in the text content
    output = output.replace(/([*_`~\\])/g, '\\$1')
  }

  // the opening tags to be added to the result
  let openingTags = ''
  // the closing tags to be added to the result
  let closingTagsBefore = ''
  let closingTagsAfter = ''

  const prevNode = getTextSibling(node, true)
  const nextNode = getTextSibling(node, false)

  const applied = new Set()

  for (const transformer of textTransformers) {
    const format = transformer.format[0]!
    const tag = transformer.tag

    // dedup applied formats
    if (hasFormat(node, format) && !applied.has(format)) {
      // Multiple tags might be used for the same format (*, _)
      applied.add(format)

      // append the tag to openningTags, if it's not applied to the previous nodes,
      // or the nodes before that (which would result in an unclosed tag)
      if (!hasFormat(prevNode, format) || !unclosedTags.find((element) => element.tag === tag)) {
        unclosedTags.push({ format, tag })
        openingTags += tag
      }
    }
  }

  // close any tags in the same order they were applied, if necessary
  for (let i = 0; i < unclosedTags.length; i++) {
    const unclosedTag = unclosedTags[i]!
    const nodeHasFormat = hasFormat(node, unclosedTag.format)
    const nextNodeHasFormat = hasFormat(nextNode, unclosedTag.format)

    // prevent adding closing tag if next sibling will do it
    if (nodeHasFormat && nextNodeHasFormat) {
      continue
    }

    const unhandledUnclosedTags = [...unclosedTags] // Shallow copy to avoid modifying the original array

    while (unhandledUnclosedTags.length > i) {
      const unclosedTag = unhandledUnclosedTags.pop()

      // If tag is unclosable, don't close it and leave it in the original array,
      // So that it can be closed when it's no longer unclosable
      if (
        unclosableTags &&
        unclosedTag &&
        unclosableTags.find((element) => element.tag === unclosedTag.tag)
      ) {
        continue
      }

      if (unclosedTag && typeof unclosedTag.tag === 'string') {
        if (!nodeHasFormat) {
          // Handles cases where the tag has not been closed before, e.g. if the previous node
          // was a text match transformer that did not account for closing tags of the next node (e.g. a link)
          closingTagsBefore += unclosedTag.tag
        } else if (!nextNodeHasFormat) {
          closingTagsAfter += unclosedTag.tag
        }
      }
      // Mutate the original array to remove the closed tag
      unclosedTags.pop()
    }
    break
  }

  output = openingTags + output + closingTagsAfter
  // Replace trimmed version of textContent ensuring surrounding whitespace is not modified
  return closingTagsBefore + textContent.replace(frozenString, () => output)
}

// Get next or previous text sibling a text node, including cases
// when it's a child of inline element (e.g. link)
function getTextSibling(node: TextNode, backward: boolean): null | TextNode {
  let sibling = backward ? node.getPreviousSibling() : node.getNextSibling()

  if (!sibling) {
    const parent = node.getParentOrThrow()

    if (parent.isInline()) {
      sibling = backward ? parent.getPreviousSibling() : parent.getNextSibling()
    }
  }

  while (sibling) {
    if ($isElementNode(sibling)) {
      if (!sibling.isInline()) {
        break
      }

      const descendant = backward ? sibling.getLastDescendant() : sibling.getFirstDescendant()

      if ($isTextNode(descendant)) {
        return descendant
      } else {
        sibling = backward ? sibling.getPreviousSibling() : sibling.getNextSibling()
      }
    }

    if ($isTextNode(sibling)) {
      return sibling
    }

    if (!$isElementNode(sibling)) {
      return null
    }
  }

  return null
}

function hasFormat(node: LexicalNode | null | undefined, format: TextFormatType): boolean {
  return $isTextNode(node) && node.hasFormat(format)
}
