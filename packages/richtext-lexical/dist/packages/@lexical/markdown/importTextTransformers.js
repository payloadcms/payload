import { $isTextNode } from 'lexical';
import { findOutermostTextFormatTransformer, importTextFormatTransformer } from './importTextFormatTransformer.js';
import { findOutermostTextMatchTransformer, importFoundTextMatchTransformer } from './importTextMatchTransformer.js';
/**
 * Handles applying both text format and text match transformers.
 * It finds the outermost text format or text match and applies it,
 * then recursively calls itself to apply the next outermost transformer,
 * until there are no more transformers to apply.
 */
export function importTextTransformers(textNode, textFormatTransformersIndex, textMatchTransformers) {
  let foundTextFormat = findOutermostTextFormatTransformer(textNode, textFormatTransformersIndex);
  let foundTextMatch = findOutermostTextMatchTransformer(textNode, textMatchTransformers);
  if (foundTextFormat && foundTextMatch) {
    // Find the outermost transformer
    if (foundTextFormat.startIndex <= foundTextMatch.startIndex && foundTextFormat.endIndex >= foundTextMatch.endIndex) {
      // foundTextFormat wraps foundTextMatch - apply foundTextFormat by setting foundTextMatch to null
      foundTextMatch = null;
    } else {
      // foundTextMatch wraps foundTextFormat - apply foundTextMatch by setting foundTextFormat to null
      foundTextFormat = null;
    }
  }
  if (foundTextFormat) {
    const result = importTextFormatTransformer(textNode, foundTextFormat.startIndex, foundTextFormat.endIndex, foundTextFormat.transformer, foundTextFormat.match);
    if (result.nodeAfter && $isTextNode(result.nodeAfter) && !result.nodeAfter.hasFormat('code')) {
      importTextTransformers(result.nodeAfter, textFormatTransformersIndex, textMatchTransformers);
    }
    if (result.nodeBefore && $isTextNode(result.nodeBefore) && !result.nodeBefore.hasFormat('code')) {
      importTextTransformers(result.nodeBefore, textFormatTransformersIndex, textMatchTransformers);
    }
    if (result.transformedNode && $isTextNode(result.transformedNode) && !result.transformedNode.hasFormat('code')) {
      importTextTransformers(result.transformedNode, textFormatTransformersIndex, textMatchTransformers);
    }
  } else if (foundTextMatch) {
    const result = importFoundTextMatchTransformer(textNode, foundTextMatch.startIndex, foundTextMatch.endIndex, foundTextMatch.transformer, foundTextMatch.match);
    if (!result) {
      return;
    }
    if (result.nodeAfter && $isTextNode(result.nodeAfter) && !result.nodeAfter.hasFormat('code')) {
      importTextTransformers(result.nodeAfter, textFormatTransformersIndex, textMatchTransformers);
    }
    if (result.nodeBefore && $isTextNode(result.nodeBefore) && !result.nodeBefore.hasFormat('code')) {
      importTextTransformers(result.nodeBefore, textFormatTransformersIndex, textMatchTransformers);
    }
    if (result.transformedNode && $isTextNode(result.transformedNode) && !result.transformedNode.hasFormat('code')) {
      importTextTransformers(result.transformedNode, textFormatTransformersIndex, textMatchTransformers);
    }
  }
  // Handle escape characters
  const textContent = textNode.getTextContent();
  const escapedText = textContent.replace(/\\([*_`~])/g, '$1');
  textNode.setTextContent(escapedText);
}
//# sourceMappingURL=importTextTransformers.js.map