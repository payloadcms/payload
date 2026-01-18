/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */import { PUNCTUATION_OR_SPACE } from './utils.js';
export function findOutermostTextFormatTransformer(textNode, textFormatTransformersIndex) {
  const textContent = textNode.getTextContent();
  const match = findOutermostMatch(textContent, textFormatTransformersIndex);
  if (!match) {
    return null;
  }
  const textFormatMatchStart = match.index || 0;
  const textFormatMatchEnd = textFormatMatchStart + match[0].length;
  // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
  const transformer = textFormatTransformersIndex.transformersByTag[match[1]];
  return {
    endIndex: textFormatMatchEnd,
    match,
    startIndex: textFormatMatchStart,
    transformer
  };
}
// Finds first "<tag>content<tag>" match that is not nested into another tag
function findOutermostMatch(textContent, textTransformersIndex) {
  const openTagsMatch = textContent.match(textTransformersIndex.openTagsRegExp);
  if (openTagsMatch == null) {
    return null;
  }
  for (const match of openTagsMatch) {
    // Open tags reg exp might capture leading space so removing it
    // before using match to find transformer
    const tag = match.replace(/^\s/, '');
    const fullMatchRegExp = textTransformersIndex.fullMatchRegExpByTag[tag];
    if (fullMatchRegExp == null) {
      continue;
    }
    const fullMatch = textContent.match(fullMatchRegExp);
    const transformer = textTransformersIndex.transformersByTag[tag];
    if (fullMatch != null && transformer != null) {
      if (transformer.intraword !== false) {
        return fullMatch;
      }
      // For non-intraword transformers checking if it's within a word
      // or surrounded with space/punctuation/newline
      const {
        index = 0
      } = fullMatch;
      const beforeChar = textContent[index - 1];
      const afterChar = textContent[index + fullMatch[0].length];
      if ((!beforeChar || PUNCTUATION_OR_SPACE.test(beforeChar)) && (!afterChar || PUNCTUATION_OR_SPACE.test(afterChar))) {
        return fullMatch;
      }
    }
  }
  return null;
}
export function importTextFormatTransformer(textNode, startIndex, endIndex, transformer, match) {
  const textContent = textNode.getTextContent();
  // No text matches - we can safely process the text format match
  let nodeAfter;
  let nodeBefore;
  let transformedNode;
  // If matching full content there's no need to run splitText and can reuse existing textNode
  // to update its content and apply format. E.g. for **_Hello_** string after applying bold
  // format (**) it will reuse the same text node to apply italic (_)
  if (match[0] === textContent) {
    transformedNode = textNode;
  } else {
    if (startIndex === 0) {
      [transformedNode, nodeAfter] = textNode.splitText(endIndex);
    } else {
      [nodeBefore, transformedNode, nodeAfter] = textNode.splitText(startIndex, endIndex);
    }
  }
  transformedNode.setTextContent(match[2]);
  if (transformer) {
    for (const format of transformer.format) {
      if (!transformedNode.hasFormat(format)) {
        transformedNode.toggleFormat(format);
      }
    }
  }
  return {
    nodeAfter,
    nodeBefore,
    transformedNode
  };
}
//# sourceMappingURL=importTextFormatTransformer.js.map