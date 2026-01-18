'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { eventFiles } from '@lexical/rich-text';
import { $getNearestNodeFromDOMNode, $getNodeByKey, isHTMLElement } from 'lexical';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditorConfigContext } from '../../../config/client/EditorConfigProvider.js';
import { Point } from '../../../utils/point.js';
import { calculateDistanceFromScrollerElem } from '../utils/calculateDistanceFromScrollerElem.js';
import { getNodeCloseToPoint } from '../utils/getNodeCloseToPoint.js';
import { getTopLevelNodeKeys } from '../utils/getTopLevelNodeKeys.js';
import { isOnHandleElement } from '../utils/isOnHandleElement.js';
import { setHandlePosition } from '../utils/setHandlePosition.js';
import { getBoundingClientRectWithoutTransform } from './getBoundingRectWithoutTransform.js';
import { setTargetLine } from './setTargetLine.js';
const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu';
const DRAG_DATA_FORMAT = 'application/x-lexical-drag-block';
let prevIndex = Infinity;
function getCurrentIndex(keysLength) {
  if (keysLength === 0) {
    return Infinity;
  }
  if (prevIndex >= 0 && prevIndex < keysLength) {
    return prevIndex;
  }
  return Math.floor(keysLength / 2);
}
function setDragImage(dataTransfer, draggableBlockElem) {
  const {
    transform
  } = draggableBlockElem.style;
  // Remove dragImage borders
  dataTransfer.setDragImage(draggableBlockElem, 0, 0);
  setTimeout(() => {
    draggableBlockElem.style.transform = transform;
  });
}
function hideTargetLine(targetLineElem, lastTargetBlockElem) {
  if (targetLineElem) {
    targetLineElem.style.opacity = '0';
  }
  if (lastTargetBlockElem) {
    lastTargetBlockElem.style.opacity = '';
    // Delete marginBottom and marginTop values we set
    lastTargetBlockElem.style.marginBottom = '';
    lastTargetBlockElem.style.marginTop = '';
    //lastTargetBlock.style.border = 'none'
  }
}
function useDraggableBlockMenu(editor, anchorElem, isEditable) {
  const scrollerElem = anchorElem.parentElement;
  const menuRef = useRef(null);
  const targetLineRef = useRef(null);
  const debugHighlightRef = useRef(null);
  const isDraggingBlockRef = useRef(false);
  const [draggableBlockElem, setDraggableBlockElem] = useState(null);
  const [lastTargetBlock, setLastTargetBlock] = useState(null);
  const {
    editorConfig
  } = useEditorConfigContext();
  const blockHandleHorizontalOffset = editorConfig?.admin?.hideGutter ? -44 : -8;
  useEffect(() => {
    /**
    * Handles positioning of the drag handle
    */
    function onDocumentMouseMove(event) {
      const target = event.target;
      if (!isHTMLElement(target)) {
        return;
      }
      const distanceFromScrollerElem = calculateDistanceFromScrollerElem(scrollerElem, event.pageX, event.pageY, target);
      if (distanceFromScrollerElem === -1) {
        setDraggableBlockElem(null);
        return;
      }
      if (isOnHandleElement(target, DRAGGABLE_BLOCK_MENU_CLASSNAME)) {
        return;
      }
      const topLevelNodeKeys = getTopLevelNodeKeys(editor);
      const {
        blockElem: _draggableBlockElem,
        foundAtIndex,
        isFoundNodeEmptyParagraph
      } = getNodeCloseToPoint({
        anchorElem,
        cache_threshold: 0,
        editor,
        horizontalOffset: -distanceFromScrollerElem,
        point: new Point(event.x, event.y),
        startIndex: getCurrentIndex(topLevelNodeKeys.length),
        useEdgeAsDefault: false,
        verbose: false
      });
      prevIndex = foundAtIndex;
      //if (DEBUG && _draggableBlockElem) {
      //targetBlockElem.style.border = '3px solid red'
      // highlightElemOriginalPosition(debugHighlightRef, _draggableBlockElem, anchorElem)
      //}
      if (!_draggableBlockElem && !isFoundNodeEmptyParagraph) {
        return;
      }
      if (draggableBlockElem !== _draggableBlockElem) {
        setDraggableBlockElem(_draggableBlockElem);
      }
    }
    // Since the draggableBlockElem is outside the actual editor, we need to listen to the document
    // to be able to detect when the mouse is outside the editor and respect a buffer around
    // the scrollerElem to avoid the draggableBlockElem disappearing too early.
    document?.addEventListener('mousemove', onDocumentMouseMove);
    return () => {
      document?.removeEventListener('mousemove', onDocumentMouseMove);
    };
  }, [scrollerElem, anchorElem, editor, draggableBlockElem]);
  useEffect(() => {
    if (menuRef.current) {
      setHandlePosition(draggableBlockElem, menuRef.current, anchorElem, blockHandleHorizontalOffset);
    }
  }, [anchorElem, draggableBlockElem, blockHandleHorizontalOffset]);
  useEffect(() => {
    function onDragover(event_0) {
      if (!isDraggingBlockRef.current) {
        return false;
      }
      const [isFileTransfer] = eventFiles(event_0);
      if (isFileTransfer) {
        return false;
      }
      const {
        pageY,
        target: target_0
      } = event_0;
      if (!isHTMLElement(target_0)) {
        return false;
      }
      const distanceFromScrollerElem_0 = calculateDistanceFromScrollerElem(scrollerElem, event_0.pageX, event_0.pageY, target_0, 100, 50);
      const topLevelNodeKeys_0 = getTopLevelNodeKeys(editor);
      const {
        blockElem: targetBlockElem,
        foundAtIndex: foundAtIndex_0,
        isFoundNodeEmptyParagraph: isFoundNodeEmptyParagraph_0
      } = getNodeCloseToPoint({
        anchorElem,
        editor,
        fuzzy: true,
        horizontalOffset: -distanceFromScrollerElem_0,
        point: new Point(event_0.x, event_0.y),
        startIndex: getCurrentIndex(topLevelNodeKeys_0.length),
        useEdgeAsDefault: true,
        verbose: true
      });
      prevIndex = foundAtIndex_0;
      const targetLineElem = targetLineRef.current;
      // targetBlockElem === null shouldn't happen
      if (targetBlockElem === null || targetLineElem === null) {
        return false;
      }
      if (draggableBlockElem !== targetBlockElem) {
        const {
          isBelow,
          willStayInSamePosition
        } = setTargetLine(editorConfig?.admin?.hideGutter ? '0px' : '3rem', blockHandleHorizontalOffset + (editorConfig?.admin?.hideGutter ? menuRef?.current?.getBoundingClientRect()?.width ?? 0 : -(menuRef?.current?.getBoundingClientRect()?.width ?? 0)), targetLineElem, targetBlockElem, lastTargetBlock, pageY, anchorElem, event_0, debugHighlightRef, isFoundNodeEmptyParagraph_0);
        // Prevent default event to be able to trigger onDrop events
        // Calling preventDefault() adds the green plus icon to the cursor,
        // indicating that the drop is allowed.
        event_0.preventDefault();
        if (!willStayInSamePosition) {
          setLastTargetBlock({
            boundingBox: targetBlockElem.getBoundingClientRect(),
            elem: targetBlockElem,
            isBelow
          });
        }
      } else if (lastTargetBlock?.elem) {
        hideTargetLine(targetLineElem, lastTargetBlock.elem);
        setLastTargetBlock({
          boundingBox: targetBlockElem.getBoundingClientRect(),
          elem: targetBlockElem,
          isBelow: false
        });
      }
      return true;
    }
    function onDrop(event_1) {
      if (!isDraggingBlockRef.current) {
        return false;
      }
      const [isFileTransfer_0] = eventFiles(event_1);
      if (isFileTransfer_0) {
        return false;
      }
      const {
        dataTransfer,
        pageY: pageY_0,
        target: target_1
      } = event_1;
      const dragData = dataTransfer?.getData(DRAG_DATA_FORMAT) || '';
      editor.update(() => {
        const draggedNode = $getNodeByKey(dragData);
        if (!draggedNode) {
          return false;
        }
        if (!isHTMLElement(target_1)) {
          return false;
        }
        const distanceFromScrollerElem_1 = calculateDistanceFromScrollerElem(scrollerElem, event_1.pageX, event_1.pageY, target_1, 100, 50);
        const {
          blockElem: targetBlockElem_0,
          isFoundNodeEmptyParagraph: isFoundNodeEmptyParagraph_1
        } = getNodeCloseToPoint({
          anchorElem,
          editor,
          fuzzy: true,
          horizontalOffset: -distanceFromScrollerElem_1,
          point: new Point(event_1.x, event_1.y),
          useEdgeAsDefault: true
        });
        if (!targetBlockElem_0) {
          return false;
        }
        const targetNode = $getNearestNodeFromDOMNode(targetBlockElem_0);
        if (!targetNode) {
          return false;
        }
        if (targetNode === draggedNode) {
          return true;
        }
        const {
          height: targetBlockElemHeight,
          top: targetBlockElemTop
        } = getBoundingClientRectWithoutTransform(targetBlockElem_0);
        const mouseY = pageY_0;
        const isBelow_0 = mouseY >= targetBlockElemTop + targetBlockElemHeight / 2 + window.scrollY;
        if (!isFoundNodeEmptyParagraph_1) {
          if (isBelow_0) {
            // below targetBlockElem
            targetNode.insertAfter(draggedNode);
          } else {
            // above targetBlockElem
            targetNode.insertBefore(draggedNode);
          }
        } else {
          //
          targetNode.insertBefore(draggedNode);
          targetNode.remove();
        }
        /*
        if (pageY >= targetBlockElemTop + targetBlockElemHeight / 2) {
        targetNode.insertAfter(draggedNode)
        } else {
        targetNode.insertBefore(draggedNode)
        }*/
        if (draggableBlockElem !== null) {
          setDraggableBlockElem(null);
        }
        // find all previous elements with lexical-block-highlighter class and remove them
        const allPrevHighlighters = document.querySelectorAll('.lexical-block-highlighter');
        allPrevHighlighters.forEach(highlighter => {
          highlighter.remove();
        });
        const newInsertedElem = editor.getElementByKey(draggedNode.getKey());
        setTimeout(() => {
          // add new temp html element to newInsertedElem with the same height and width and the class block-selected
          // to highlight the new inserted element
          const newInsertedElemRect = newInsertedElem?.getBoundingClientRect();
          if (!newInsertedElemRect) {
            return;
          }
          const highlightElem = document.createElement('div');
          highlightElem.className = 'lexical-block-highlighter';
          highlightElem.style.backgroundColor = 'var(--theme-elevation-1000';
          highlightElem.style.transition = 'opacity 0.5s ease-in-out';
          highlightElem.style.zIndex = '1';
          highlightElem.style.pointerEvents = 'none';
          highlightElem.style.boxSizing = 'border-box';
          highlightElem.style.borderRadius = '4px';
          highlightElem.style.position = 'absolute';
          document.body.appendChild(highlightElem);
          highlightElem.style.opacity = '0.1';
          highlightElem.style.height = `${newInsertedElemRect.height + 8}px`;
          highlightElem.style.width = `${newInsertedElemRect.width + 8}px`;
          highlightElem.style.top = `${newInsertedElemRect.top + window.scrollY - 4}px`;
          highlightElem.style.left = `${newInsertedElemRect.left - 4}px`;
          setTimeout(() => {
            highlightElem.style.opacity = '0';
            setTimeout(() => {
              highlightElem.remove();
            }, 500);
          }, 1000);
        }, 120);
      });
      return true;
    }
    // register onDragover event listeners:
    document.addEventListener('dragover', onDragover);
    // register onDrop event listeners:
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragover', onDragover);
      document.removeEventListener('drop', onDrop);
    };
  }, [scrollerElem, blockHandleHorizontalOffset, anchorElem, editor, lastTargetBlock, draggableBlockElem, editorConfig?.admin?.hideGutter]);
  function onDragStart(event_2) {
    const dataTransfer_0 = event_2.dataTransfer;
    if (!dataTransfer_0 || !draggableBlockElem) {
      return;
    }
    setDragImage(dataTransfer_0, draggableBlockElem);
    let nodeKey = '';
    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableBlockElem);
      if (node) {
        nodeKey = node.getKey();
      }
    });
    isDraggingBlockRef.current = true;
    dataTransfer_0.setData(DRAG_DATA_FORMAT, nodeKey);
  }
  function onDragEnd() {
    isDraggingBlockRef.current = false;
    if (lastTargetBlock?.elem) {
      hideTargetLine(targetLineRef.current, lastTargetBlock?.elem);
    }
  }
  return /*#__PURE__*/createPortal(/*#__PURE__*/_jsxs(React.Fragment, {
    children: [/*#__PURE__*/_jsx("button", {
      "aria-label": "Drag to move",
      className: "icon draggable-block-menu",
      draggable: true,
      onDragEnd: onDragEnd,
      onDragStart: onDragStart,
      ref: menuRef,
      type: "button",
      children: /*#__PURE__*/_jsx("div", {
        className: isEditable ? 'icon' : ''
      })
    }), /*#__PURE__*/_jsx("div", {
      className: "draggable-block-target-line",
      ref: targetLineRef
    }), /*#__PURE__*/_jsx("div", {
      className: "debug-highlight",
      ref: debugHighlightRef
    })]
  }), anchorElem);
}
export function DraggableBlockPlugin(t0) {
  const {
    anchorElem: t1
  } = t0;
  const anchorElem = t1 === undefined ? document.body : t1;
  const [editor] = useLexicalComposerContext();
  return useDraggableBlockMenu(editor, anchorElem, editor._editable);
}
//# sourceMappingURL=index.js.map