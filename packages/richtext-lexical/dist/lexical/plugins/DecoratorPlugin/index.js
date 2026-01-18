'use client';

import { c as _c } from "react/compiler-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import { $createNodeSelection, $getEditor, $getNearestNodeFromDOMNode, $getSelection, $isDecoratorNode, $isElementNode, $isLineBreakNode, $isNodeSelection, $isRangeSelection, $isRootOrShadowRoot, $isTextNode, $setSelection, CLICK_COMMAND, COMMAND_PRIORITY_LOW, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_UP_COMMAND, KEY_BACKSPACE_COMMAND, KEY_DELETE_COMMAND, SELECTION_CHANGE_COMMAND } from 'lexical';
import { useEffect } from 'react';
// TODO: This should ideally be fixed in Lexical. See
// https://github.com/facebook/lexical/pull/7072
export function DecoratorPlugin() {
  const $ = _c(3);
  const [editor] = useLexicalComposerContext();
  const $onDelete = _temp2;
  let t0;
  let t1;
  if ($[0] !== editor) {
    t0 = () => mergeRegister(editor.registerCommand(CLICK_COMMAND, _temp3, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_DELETE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_BACKSPACE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW), editor.registerCommand(SELECTION_CHANGE_COMMAND, _temp4, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_ARROW_UP_COMMAND, _temp6, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_ARROW_DOWN_COMMAND, _temp8, COMMAND_PRIORITY_LOW));
    t1 = [editor];
    $[0] = editor;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  useEffect(t0, t1);
  return null;
}
function _temp8(event_2) {
  const selection_1 = $getSelection();
  if ($isNodeSelection(selection_1)) {
    event_2.preventDefault();
    const nextSibling = selection_1.getNodes()[0]?.getNextSibling();
    if ($isDecoratorNode(nextSibling)) {
      const element_0 = $getEditor().getElementByKey(nextSibling.getKey());
      if (element_0) {
        $selectDecorator({
          element: element_0,
          node: nextSibling
        });
      }
      return true;
    }
    if (!$isElementNode(nextSibling)) {
      return true;
    }
    const firstDescendant = nextSibling.getFirstDescendant() ?? nextSibling;
    if (!firstDescendant) {
      return true;
    }
    const block_0 = $findMatchingParent(firstDescendant, INTERNAL_$isBlock);
    block_0?.selectEnd();
    event_2.preventDefault();
    return true;
  }
  if (!$isRangeSelection(selection_1)) {
    return false;
  }
  const lastPoint = selection_1.isBackward() ? selection_1.anchor : selection_1.focus;
  const lastNode = lastPoint.getNode();
  const lastSelectedBlock = $findMatchingParent(lastNode, _temp7);
  const nextBlock = lastSelectedBlock?.getNextSibling();
  if (!lastSelectedBlock || nextBlock !== findLaterSiblingBlock(lastSelectedBlock)) {
    return false;
  }
  if ($isDecoratorNode(nextBlock)) {
    const nextBlockElement = $getEditor().getElementByKey(nextBlock.getKey());
    if (nextBlockElement) {
      $selectDecorator({
        element: nextBlockElement,
        node: nextBlock
      });
      event_2.preventDefault();
      return true;
    }
  }
  return false;
}
function _temp7(node_1) {
  return findLaterSiblingBlock(node_1) !== null;
}
function _temp6(event_1) {
  const selection_0 = $getSelection();
  if ($isNodeSelection(selection_0)) {
    const prevSibling = selection_0.getNodes()[0]?.getPreviousSibling();
    if ($isDecoratorNode(prevSibling)) {
      const element = $getEditor().getElementByKey(prevSibling.getKey());
      if (element) {
        $selectDecorator({
          element,
          node: prevSibling
        });
        event_1.preventDefault();
        return true;
      }
      return false;
    }
    if (!$isElementNode(prevSibling)) {
      return false;
    }
    const lastDescendant = prevSibling.getLastDescendant() ?? prevSibling;
    if (!lastDescendant) {
      return false;
    }
    const block = $findMatchingParent(lastDescendant, INTERNAL_$isBlock);
    block?.selectStart();
    event_1.preventDefault();
    return true;
  }
  if (!$isRangeSelection(selection_0)) {
    return false;
  }
  const firstPoint = selection_0.isBackward() ? selection_0.anchor : selection_0.focus;
  const firstNode = firstPoint.getNode();
  const firstSelectedBlock = $findMatchingParent(firstNode, _temp5);
  const prevBlock = firstSelectedBlock?.getPreviousSibling();
  if (!firstSelectedBlock || prevBlock !== findFirstSiblingBlock(firstSelectedBlock)) {
    return false;
  }
  if ($isDecoratorNode(prevBlock)) {
    const prevBlockElement = $getEditor().getElementByKey(prevBlock.getKey());
    if (prevBlockElement) {
      $selectDecorator({
        element: prevBlockElement,
        node: prevBlock
      });
      event_1.preventDefault();
      return true;
    }
  }
  return false;
}
function _temp5(node_0) {
  return findFirstSiblingBlock(node_0) !== null;
}
function _temp4() {
  const decorator_0 = $getSelectedDecorator();
  document.querySelector(".decorator-selected")?.classList.remove("decorator-selected");
  if (decorator_0) {
    decorator_0.element?.classList.add("decorator-selected");
    return true;
  }
  return false;
}
function _temp3(event_0) {
  document.querySelector(".decorator-selected")?.classList.remove("decorator-selected");
  const decorator = $getDecoratorByMouseEvent(event_0);
  if (!decorator) {
    return true;
  }
  const {
    target
  } = event_0;
  const isInteractive = !(target instanceof HTMLElement) || target.isContentEditable || target.closest("button, textarea, input, .react-select, .code-editor, .no-select-decorator, [role=\"button\"]");
  if (isInteractive) {
    $setSelection(null);
  } else {
    $selectDecorator(decorator);
  }
  return true;
}
function _temp2(event) {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return false;
  }
  event.preventDefault();
  selection.getNodes().forEach(_temp);
  return true;
}
function _temp(node) {
  node.remove();
}
function $getDecoratorByMouseEvent(event) {
  if (!(event.target instanceof HTMLElement)) {
    return undefined;
  }
  const element = event.target.closest('[data-lexical-decorator="true"]');
  if (!(element instanceof HTMLElement)) {
    return undefined;
  }
  const node = $getNearestNodeFromDOMNode(element);
  return $isDecoratorNode(node) ? {
    element,
    node
  } : undefined;
}
function $getSelectedDecorator() {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return undefined;
  }
  const nodes = selection.getNodes();
  if (nodes.length !== 1) {
    return undefined;
  }
  const node = nodes[0];
  return $isDecoratorNode(node) ? {
    decorator: node,
    element: $getEditor().getElementByKey(node.getKey())
  } : undefined;
}
function $selectDecorator({
  element,
  node
}) {
  document.querySelector('.decorator-selected')?.classList.remove('decorator-selected');
  const selection = $createNodeSelection();
  selection.add(node.getKey());
  $setSelection(selection);
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest'
  });
  element.classList.add('decorator-selected');
}
/**
 * Copied from https://github.com/facebook/lexical/blob/main/packages/lexical/src/LexicalUtils.ts
 *
 * This function returns true for a DecoratorNode that is not inline OR
 * an ElementNode that is:
 * - not a root or shadow root
 * - not inline
 * - can't be empty
 * - has no children or an inline first child
 */
export function INTERNAL_$isBlock(node) {
  if ($isDecoratorNode(node) && !node.isInline()) {
    return true;
  }
  if (!$isElementNode(node) || $isRootOrShadowRoot(node)) {
    return false;
  }
  const firstChild = node.getFirstChild();
  const isLeafElement = firstChild === null || $isLineBreakNode(firstChild) || $isTextNode(firstChild) || firstChild.isInline();
  return !node.isInline() && node.canBeEmpty() !== false && isLeafElement;
}
function findLaterSiblingBlock(node) {
  let current = node.getNextSibling();
  while (current !== null) {
    if (INTERNAL_$isBlock(current)) {
      return current;
    }
    current = current.getNextSibling();
  }
  return null;
}
function findFirstSiblingBlock(node) {
  let current = node.getPreviousSibling();
  while (current !== null) {
    if (INTERNAL_$isBlock(current)) {
      return current;
    }
    current = current.getPreviousSibling();
  }
  return null;
}
//# sourceMappingURL=index.js.map