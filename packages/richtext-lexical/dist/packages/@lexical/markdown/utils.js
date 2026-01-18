/* eslint-disable regexp/no-obscure-range */ /* eslint-disable regexp/no-empty-group */ /* eslint-disable regexp/no-empty-capturing-group */ /* eslint-disable regexp/optimal-quantifier-concatenation */ /* eslint-disable regexp/no-misleading-capturing-group */ /* eslint-disable regexp/no-contradiction-with-assertion */ /* eslint-disable regexp/no-super-linear-backtracking */ /**
                                                                                                                                                                                                                                                                                                                                                                                         * Copyright (c) Meta Platforms, Inc. and affiliates.
                                                                                                                                                                                                                                                                                                                                                                                         *
                                                                                                                                                                                                                                                                                                                                                                                         * This source code is licensed under the MIT license found in the
                                                                                                                                                                                                                                                                                                                                                                                         * LICENSE file in the root directory of this source tree.
                                                                                                                                                                                                                                                                                                                                                                                         *
                                                                                                                                                                                                                                                                                                                                                                                         */import { $isListItemNode, $isListNode } from '@lexical/list';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $isParagraphNode, $isTextNode } from 'lexical';
const autoFormatBase = {
  markdownFormatKind: null,
  regEx: /(?:)/,
  regExForAutoFormatting: /(?:)/,
  requiresParagraphStart: false
};
const paragraphStartBase = {
  ...autoFormatBase,
  requiresParagraphStart: true
};
const markdownHeader1 = {
  ...paragraphStartBase,
  export: createHeadingExport(1),
  markdownFormatKind: 'paragraphH1',
  regEx: /^# /,
  regExForAutoFormatting: /^# /
};
const markdownHeader2 = {
  ...paragraphStartBase,
  export: createHeadingExport(2),
  markdownFormatKind: 'paragraphH2',
  regEx: /^## /,
  regExForAutoFormatting: /^## /
};
const markdownHeader3 = {
  ...paragraphStartBase,
  export: createHeadingExport(3),
  markdownFormatKind: 'paragraphH3',
  regEx: /^### /,
  regExForAutoFormatting: /^### /
};
const markdownHeader4 = {
  ...paragraphStartBase,
  export: createHeadingExport(4),
  markdownFormatKind: 'paragraphH4',
  regEx: /^#### /,
  regExForAutoFormatting: /^#### /
};
const markdownHeader5 = {
  ...paragraphStartBase,
  export: createHeadingExport(5),
  markdownFormatKind: 'paragraphH5',
  regEx: /^##### /,
  regExForAutoFormatting: /^##### /
};
const markdownHeader6 = {
  ...paragraphStartBase,
  export: createHeadingExport(6),
  markdownFormatKind: 'paragraphH6',
  regEx: /^###### /,
  regExForAutoFormatting: /^###### /
};
const markdownBlockQuote = {
  ...paragraphStartBase,
  export: blockQuoteExport,
  markdownFormatKind: 'paragraphBlockQuote',
  regEx: /^> /,
  regExForAutoFormatting: /^> /
};
const markdownUnorderedListDash = {
  ...paragraphStartBase,
  export: listExport,
  markdownFormatKind: 'paragraphUnorderedList',
  regEx: /^(\s{0,10})- /,
  regExForAutoFormatting: /^(\s{0,10})- /
};
const markdownUnorderedListAsterisk = {
  ...paragraphStartBase,
  export: listExport,
  markdownFormatKind: 'paragraphUnorderedList',
  regEx: /^(\s{0,10})\* /,
  regExForAutoFormatting: /^(\s{0,10})\* /
};
const markdownOrderedList = {
  ...paragraphStartBase,
  export: listExport,
  markdownFormatKind: 'paragraphOrderedList',
  regEx: /^(\s{0,10})(\d+)\.\s/,
  regExForAutoFormatting: /^(\s{0,10})(\d+)\.\s/
};
const markdownHorizontalRule = {
  ...paragraphStartBase,
  markdownFormatKind: 'horizontalRule',
  regEx: /^\*\*\*$/,
  regExForAutoFormatting: /^\*\*\* /
};
const markdownHorizontalRuleUsingDashes = {
  ...paragraphStartBase,
  markdownFormatKind: 'horizontalRule',
  regEx: /^---$/,
  regExForAutoFormatting: /^--- /
};
const markdownInlineCode = {
  ...autoFormatBase,
  exportFormat: 'code',
  exportTag: '`',
  markdownFormatKind: 'code',
  regEx: /(`)(\s*)([^`]*)(\s*)(`)()/,
  regExForAutoFormatting: /(`)(\s*\b)([^`]*)(\b\s*)(`)(\s)$/
};
const markdownBold = {
  ...autoFormatBase,
  exportFormat: 'bold',
  exportTag: '**',
  markdownFormatKind: 'bold',
  regEx: /(\*\*)(\s*)([^*]*)(\s*)(\*\*)()/,
  regExForAutoFormatting: /(\*\*)(\s*\b)([^*]*)(\b\s*)(\*\*)(\s)$/
};
const markdownItalic = {
  ...autoFormatBase,
  exportFormat: 'italic',
  exportTag: '*',
  markdownFormatKind: 'italic',
  regEx: /(\*)(\s*)([^*]*)(\s*)(\*)()/,
  regExForAutoFormatting: /(\*)(\s*\b)([^*]*)(\b\s*)(\*)(\s)$/
};
const markdownBold2 = {
  ...autoFormatBase,
  exportFormat: 'bold',
  exportTag: '_',
  markdownFormatKind: 'bold',
  regEx: /(__)(\s*)([^_]*)(\s*)(__)()/,
  regExForAutoFormatting: /(__)(\s*)([^_]*)(\s*)(__)(\s)$/
};
const markdownItalic2 = {
  ...autoFormatBase,
  exportFormat: 'italic',
  exportTag: '_',
  markdownFormatKind: 'italic',
  regEx: /(_)()([^_]*)()(_)()/,
  regExForAutoFormatting: /(_)()([^_]*)()(_)(\s)$/
};
const fakeMarkdownUnderline = {
  ...autoFormatBase,
  exportFormat: 'underline',
  exportTag: '<u>',
  exportTagClose: '</u>',
  markdownFormatKind: 'underline',
  regEx: /(<u>)(\s*)([^<]*)(\s*)(<\/u>)()/,
  regExForAutoFormatting: /(<u>)(\s*\b)([^<]*)(\b\s*)(<\/u>)(\s)$/
};
const markdownStrikethrough = {
  ...autoFormatBase,
  exportFormat: 'strikethrough',
  exportTag: '~~',
  markdownFormatKind: 'strikethrough',
  regEx: /(~~)(\s*)([^~]*)(\s*)(~~)()/,
  regExForAutoFormatting: /(~~)(\s*\b)([^~]*)(\b\s*)(~~)(\s)$/
};
const markdownStrikethroughItalicBold = {
  ...autoFormatBase,
  markdownFormatKind: 'strikethrough_italic_bold',
  regEx: /(~~_\*\*)(\s*\b)([^*_~]+)(\b\s*)(\*\*_~~)()/,
  regExForAutoFormatting: /(~~_\*\*)(\s*\b)([^*_~]+)(\b\s*)(\*\*_~~)(\s)$/
};
const markdownItalicbold = {
  ...autoFormatBase,
  markdownFormatKind: 'italic_bold',
  regEx: /(_\*\*)(\s*\b)([^*_]+)(\b\s*)(\*\*_)/,
  regExForAutoFormatting: /(_\*\*)(\s*\b)([^*_]+)(\b\s*)(\*\*_)(\s)$/
};
const markdownStrikethroughItalic = {
  ...autoFormatBase,
  markdownFormatKind: 'strikethrough_italic',
  regEx: /(~~_)(\s*)([^_~]+)(\s*)(_~~)/,
  regExForAutoFormatting: /(~~_)(\s*)([^_~]+)(\s*)(_~~)(\s)$/
};
const markdownStrikethroughBold = {
  ...autoFormatBase,
  markdownFormatKind: 'strikethrough_bold',
  regEx: /(~~\*\*)(\s*\b)([^*~]+)(\b\s*)(\*\*~~)/,
  regExForAutoFormatting: /(~~\*\*)(\s*\b)([^*~]+)(\b\s*)(\*\*~~)(\s)$/
};
const markdownLink = {
  ...autoFormatBase,
  markdownFormatKind: 'link',
  regEx: /(\[)([^\]]*)(\]\()([^)]*)(\)*)()/,
  regExForAutoFormatting: /(\[)([^\]]*)(\]\()([^)]*)(\)*)(\s)$/
};
const allMarkdownCriteriaForTextNodes = [
// Place the combination formats ahead of the individual formats.
// Combos
markdownStrikethroughItalicBold, markdownItalicbold, markdownStrikethroughItalic, markdownStrikethroughBold, markdownInlineCode, markdownBold, markdownItalic, markdownBold2, markdownItalic2, fakeMarkdownUnderline, markdownStrikethrough, markdownLink];
const allMarkdownCriteriaForParagraphs = [markdownHeader1, markdownHeader2, markdownHeader3, markdownHeader4, markdownHeader5, markdownHeader6, markdownBlockQuote, markdownUnorderedListDash, markdownUnorderedListAsterisk, markdownOrderedList, markdownHorizontalRule, markdownHorizontalRuleUsingDashes];
export function getAllMarkdownCriteriaForParagraphs() {
  return allMarkdownCriteriaForParagraphs;
}
export function getAllMarkdownCriteriaForTextNodes() {
  return allMarkdownCriteriaForTextNodes;
}
function createHeadingExport(level) {
  return (node, exportChildren) => {
    return $isHeadingNode(node) && node.getTag() === 'h' + level ? '#'.repeat(level) + ' ' + exportChildren(node) : null;
  };
}
function listExport(node, exportChildren) {
  return $isListNode(node) ? processNestedLists(node, exportChildren, 0) : null;
}
// TODO: should be param
const LIST_INDENT_SIZE = 4;
function processNestedLists(listNode, exportChildren, depth) {
  const output = [];
  const children = listNode.getChildren();
  let index = 0;
  for (const listItemNode of children) {
    if ($isListItemNode(listItemNode)) {
      if (listItemNode.getChildrenSize() === 1) {
        const firstChild = listItemNode.getFirstChild();
        if ($isListNode(firstChild)) {
          output.push(processNestedLists(firstChild, exportChildren, depth + 1));
          continue;
        }
      }
      const indent = ' '.repeat(depth * LIST_INDENT_SIZE);
      const prefix = listNode.getListType() === 'bullet' ? '- ' : `${listNode.getStart() + index}. `;
      output.push(indent + prefix + exportChildren(listItemNode));
      index++;
    }
  }
  return output.join('\n');
}
function blockQuoteExport(node, exportChildren) {
  return $isQuoteNode(node) ? '> ' + exportChildren(node) : null;
}
export function indexBy(list, callback) {
  const index = {};
  for (const item of list) {
    const key = callback(item);
    if (!key) {
      continue;
    }
    if (index[key]) {
      index[key].push(item);
    } else {
      index[key] = [item];
    }
  }
  return index;
}
export function transformersByType(transformers) {
  const byType = indexBy(transformers, t => t.type);
  return {
    element: byType.element || [],
    multilineElement: byType['multiline-element'] || [],
    textFormat: byType['text-format'] || [],
    textMatch: byType['text-match'] || []
  };
}
export const PUNCTUATION_OR_SPACE = /[!-/:-@[-`{-~\s]/;
const MARKDOWN_EMPTY_LINE_REG_EXP = /^\s{0,3}$/;
export function isEmptyParagraph(node) {
  if (!$isParagraphNode(node)) {
    return false;
  }
  const firstChild = node.getFirstChild();
  return firstChild == null || node.getChildrenSize() === 1 && $isTextNode(firstChild) && MARKDOWN_EMPTY_LINE_REG_EXP.test(firstChild.getTextContent());
}
//# sourceMappingURL=utils.js.map