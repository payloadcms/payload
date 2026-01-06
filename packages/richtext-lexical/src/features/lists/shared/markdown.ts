// Copied from https://github.com/facebook/lexical/blob/176b8cf16ecb332ee5efe2c75219e223b7b019f2/packages/lexical-markdown/src/MarkdownTransformers.ts#L97C1-L172C1

import type { ListNode, ListType } from '@lexical/list'
import type { ElementNode } from 'lexical'

import { $createListItemNode, $createListNode, $isListItemNode, $isListNode } from '@lexical/list'

import type { ElementTransformer } from '../../../packages/@lexical/markdown/MarkdownTransformers.js'

// Amount of spaces that define indentation level
const LIST_INDENT_SIZE = 4

export const listReplace = (listType: ListType): ElementTransformer['replace'] => {
  return (parentNode, children, match) => {
    const previousNode = parentNode.getPreviousSibling()
    const nextNode = parentNode.getNextSibling()
    const listItem = $createListItemNode(listType === 'check' ? match[3] === 'x' : undefined)
    if ($isListNode(nextNode) && nextNode.getListType() === listType) {
      const firstChild = nextNode.getFirstChild()
      if (firstChild !== null) {
        firstChild.insertBefore(listItem)
      } else {
        // should never happen, but let's handle gracefully, just in case.
        nextNode.append(listItem)
      }
      parentNode.remove()
    } else if ($isListNode(previousNode) && previousNode.getListType() === listType) {
      previousNode.append(listItem)
      parentNode.remove()
    } else {
      const list = $createListNode(listType, listType === 'number' ? Number(match[2]) : undefined)
      list.append(listItem)
      parentNode.replace(list)
    }
    listItem.append(...children)
    listItem.select(0, 0)
    const indent = Math.floor(match[1]!.length / LIST_INDENT_SIZE)
    if (indent) {
      listItem.setIndent(indent)
    }
  }
}

export const listExport = (
  listNode: ListNode,
  exportChildren: (node: ElementNode) => string,
  depth: number,
): string => {
  const output: string[] = []
  const children = listNode.getChildren()
  let index = 0
  for (const listItemNode of children) {
    if ($isListItemNode(listItemNode)) {
      if (listItemNode.getChildrenSize() === 1) {
        const firstChild = listItemNode.getFirstChild()
        if ($isListNode(firstChild)) {
          output.push(listExport(firstChild, exportChildren, depth + 1))
          continue
        }
      }
      const indent = ' '.repeat(depth * LIST_INDENT_SIZE)
      const listType = listNode.getListType()
      const prefix =
        listType === 'number'
          ? `${listNode.getStart() + index}. `
          : listType === 'check'
            ? `- [${listItemNode.getChecked() ? 'x' : ' '}] `
            : '- '
      output.push(indent + prefix + exportChildren(listItemNode))
      index++
    }
  }

  return output.join('\n')
}
