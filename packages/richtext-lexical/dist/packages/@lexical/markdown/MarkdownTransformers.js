/* eslint-disable regexp/no-unused-capturing-group */ /**
                                                      * Copyright (c) Meta Platforms, Inc. and affiliates.
                                                      *
                                                      * This source code is licensed under the MIT license found in the
                                                      * LICENSE file in the root directory of this source tree.
                                                      *
                                                      */import { $createListItemNode, $createListNode, $isListItemNode, $isListNode, ListItemNode, ListNode } from '@lexical/list';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text';
import { $createLineBreakNode } from 'lexical';
const EMPTY_OR_WHITESPACE_ONLY = /^[\t ]*$/;
const ORDERED_LIST_REGEX = /^(\s*)(\d+)\.\s/;
const UNORDERED_LIST_REGEX = /^(\s*)[-*+]\s/;
const CHECK_LIST_REGEX = /^(\s*)(?:-\s)?\s?(\[(\s|x)?\])\s/i;
const HEADING_REGEX = /^(#{1,6})\s/;
const QUOTE_REGEX = /^>\s/;
const CODE_START_REGEX = /^[ \t]*(\\`\\`\\`|```)(\w+)?/;
const CODE_END_REGEX = /[ \t]*(\\`\\`\\`|```)$/;
const CODE_SINGLE_LINE_REGEX = /^[ \t]*```[^`]+(?:(?:`{1,2}|`{4,})[^`]+)*```(?:[^`]|$)/;
const TABLE_ROW_REG_EXP = /^\|(.+)\|\s?$/;
const TABLE_ROW_DIVIDER_REG_EXP = /^(\| ?:?-*:? ?)+\|\s?$/;
const TAG_START_REGEX = /^[ \t]*<[a-z_][\w-]*(?:\s[^<>]*)?\/?>/i;
const TAG_END_REGEX = /^[ \t]*<\/[a-z_][\w-]*\s*>/i;
const createBlockNode = createNode => {
  return (parentNode, children, match) => {
    const node = createNode(match);
    node.append(...children);
    parentNode.replace(node);
    node.select(0, 0);
  };
};
// Amount of spaces that define indentation level
// TODO: should be an option
const LIST_INDENT_SIZE = 4;
function getIndent(whitespaces) {
  const tabs = whitespaces.match(/\t/g);
  const spaces = whitespaces.match(/ /g);
  let indent = 0;
  if (tabs) {
    indent += tabs.length;
  }
  if (spaces) {
    indent += Math.floor(spaces.length / LIST_INDENT_SIZE);
  }
  return indent;
}
const listReplace = listType => {
  return (parentNode, children, match) => {
    const previousNode = parentNode.getPreviousSibling();
    const nextNode = parentNode.getNextSibling();
    const listItem = $createListItemNode(listType === 'check' ? match[3] === 'x' : undefined);
    if ($isListNode(nextNode) && nextNode.getListType() === listType) {
      const firstChild = nextNode.getFirstChild();
      if (firstChild !== null) {
        firstChild.insertBefore(listItem);
      } else {
        // should never happen, but let's handle gracefully, just in case.
        nextNode.append(listItem);
      }
      parentNode.remove();
    } else if ($isListNode(previousNode) && previousNode.getListType() === listType) {
      previousNode.append(listItem);
      parentNode.remove();
    } else {
      const list = $createListNode(listType, listType === 'number' ? Number(match[2]) : undefined);
      list.append(listItem);
      parentNode.replace(list);
    }
    listItem.append(...children);
    listItem.select(0, 0);
    const indent = getIndent(match[1]);
    if (indent) {
      listItem.setIndent(indent);
    }
  };
};
const listExport = (listNode, exportChildren, depth) => {
  const output = [];
  const children = listNode.getChildren();
  let index = 0;
  for (const listItemNode of children) {
    if ($isListItemNode(listItemNode)) {
      if (listItemNode.getChildrenSize() === 1) {
        const firstChild = listItemNode.getFirstChild();
        if ($isListNode(firstChild)) {
          output.push(listExport(firstChild, exportChildren, depth + 1));
          continue;
        }
      }
      const indent = ' '.repeat(depth * LIST_INDENT_SIZE);
      const listType = listNode.getListType();
      const prefix = listType === 'number' ? `${listNode.getStart() + index}. ` : listType === 'check' ? `- [${listItemNode.getChecked() ? 'x' : ' '}] ` : '- ';
      output.push(indent + prefix + exportChildren(listItemNode));
      index++;
    }
  }
  return output.join('\n');
};
export const HEADING = {
  type: 'element',
  dependencies: [HeadingNode],
  export: (node, exportChildren) => {
    if (!$isHeadingNode(node)) {
      return null;
    }
    const level = Number(node.getTag().slice(1));
    return '#'.repeat(level) + ' ' + exportChildren(node);
  },
  regExp: HEADING_REGEX,
  replace: createBlockNode(match => {
    const tag = 'h' + match[1].length;
    return $createHeadingNode(tag);
  })
};
export const QUOTE = {
  type: 'element',
  dependencies: [QuoteNode],
  export: (node, exportChildren) => {
    if (!$isQuoteNode(node)) {
      return null;
    }
    const lines = exportChildren(node).split('\n');
    const output = [];
    for (const line of lines) {
      output.push('> ' + line);
    }
    return output.join('\n');
  },
  regExp: QUOTE_REGEX,
  replace: (parentNode, children, _match, isImport) => {
    if (isImport) {
      const previousNode = parentNode.getPreviousSibling();
      if ($isQuoteNode(previousNode)) {
        previousNode.splice(previousNode.getChildrenSize(), 0, [$createLineBreakNode(), ...children]);
        previousNode.select(0, 0);
        parentNode.remove();
        return;
      }
    }
    const node = $createQuoteNode();
    node.append(...children);
    parentNode.replace(node);
    node.select(0, 0);
  }
};
export const UNORDERED_LIST = {
  type: 'element',
  dependencies: [ListNode, ListItemNode],
  export: (node, exportChildren) => {
    return $isListNode(node) ? listExport(node, exportChildren, 0) : null;
  },
  regExp: UNORDERED_LIST_REGEX,
  replace: listReplace('bullet')
};
export const CHECK_LIST = {
  type: 'element',
  dependencies: [ListNode, ListItemNode],
  export: (node, exportChildren) => {
    return $isListNode(node) ? listExport(node, exportChildren, 0) : null;
  },
  regExp: CHECK_LIST_REGEX,
  replace: listReplace('check')
};
export const ORDERED_LIST = {
  type: 'element',
  dependencies: [ListNode, ListItemNode],
  export: (node, exportChildren) => {
    return $isListNode(node) ? listExport(node, exportChildren, 0) : null;
  },
  regExp: ORDERED_LIST_REGEX,
  replace: listReplace('number')
};
export const INLINE_CODE = {
  type: 'text-format',
  format: ['code'],
  tag: '`'
};
export const HIGHLIGHT = {
  type: 'text-format',
  format: ['highlight'],
  tag: '=='
};
export const BOLD_ITALIC_STAR = {
  type: 'text-format',
  format: ['bold', 'italic'],
  tag: '***'
};
export const BOLD_ITALIC_UNDERSCORE = {
  type: 'text-format',
  format: ['bold', 'italic'],
  intraword: false,
  tag: '___'
};
export const BOLD_STAR = {
  type: 'text-format',
  format: ['bold'],
  tag: '**'
};
export const BOLD_UNDERSCORE = {
  type: 'text-format',
  format: ['bold'],
  intraword: false,
  tag: '__'
};
export const STRIKETHROUGH = {
  type: 'text-format',
  format: ['strikethrough'],
  tag: '~~'
};
export const ITALIC_STAR = {
  type: 'text-format',
  format: ['italic'],
  tag: '*'
};
export const ITALIC_UNDERSCORE = {
  type: 'text-format',
  format: ['italic'],
  intraword: false,
  tag: '_'
};
export function normalizeMarkdown(input, shouldMergeAdjacentLines) {
  const lines = input.split('\n');
  let inCodeBlock = false;
  const sanitizedLines = [];
  let nestedDeepCodeBlock = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lastLine = sanitizedLines[sanitizedLines.length - 1];
    // Code blocks of ```single line``` don't toggle the inCodeBlock flag
    if (CODE_SINGLE_LINE_REGEX.test(line)) {
      sanitizedLines.push(line);
      continue;
    }
    if (CODE_END_REGEX.test(line)) {
      if (nestedDeepCodeBlock === 0) {
        inCodeBlock = true;
      }
      if (nestedDeepCodeBlock === 1) {
        inCodeBlock = false;
      }
      if (nestedDeepCodeBlock > 0) {
        nestedDeepCodeBlock--;
      }
      sanitizedLines.push(line);
      continue;
    }
    // Toggle inCodeBlock state when encountering start or end of a code block
    if (CODE_START_REGEX.test(line)) {
      inCodeBlock = true;
      nestedDeepCodeBlock++;
      sanitizedLines.push(line);
      continue;
    }
    // If we are inside a code block, keep the line unchanged
    if (inCodeBlock) {
      sanitizedLines.push(line);
      continue;
    }
    // In markdown the concept of "empty paragraphs" does not exist.
    // Blocks must be separated by an empty line. Non-empty adjacent lines must be merged.
    if (EMPTY_OR_WHITESPACE_ONLY.test(line) || EMPTY_OR_WHITESPACE_ONLY.test(lastLine) || !lastLine || HEADING_REGEX.test(lastLine) || HEADING_REGEX.test(line) || QUOTE_REGEX.test(line) || ORDERED_LIST_REGEX.test(line) || UNORDERED_LIST_REGEX.test(line) || CHECK_LIST_REGEX.test(line) || TABLE_ROW_REG_EXP.test(line) || TABLE_ROW_DIVIDER_REG_EXP.test(line) || !shouldMergeAdjacentLines || TAG_START_REGEX.test(line) || TAG_END_REGEX.test(line) || TAG_START_REGEX.test(lastLine) || TAG_END_REGEX.test(lastLine) || CODE_END_REGEX.test(lastLine)) {
      sanitizedLines.push(line);
    } else {
      sanitizedLines[sanitizedLines.length - 1] = lastLine + ' ' + line.trim();
    }
  }
  return sanitizedLines.join('\n');
}
//# sourceMappingURL=MarkdownTransformers.js.map