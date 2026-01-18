'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { $createParagraphNode, isHTMLElement } from 'lexical';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditorConfigContext } from '../../../config/client/EditorConfigProvider.js';
import { Point } from '../../../utils/point.js';
import { ENABLE_SLASH_MENU_COMMAND } from '../../SlashMenu/LexicalTypeaheadMenuPlugin/index.js';
import { calculateDistanceFromScrollerElem } from '../utils/calculateDistanceFromScrollerElem.js';
import { getNodeCloseToPoint } from '../utils/getNodeCloseToPoint.js';
import { getTopLevelNodeKeys } from '../utils/getTopLevelNodeKeys.js';
import { isOnHandleElement } from '../utils/isOnHandleElement.js';
import { setHandlePosition } from '../utils/setHandlePosition.js';
const ADD_BLOCK_MENU_CLASSNAME = 'add-block-menu';
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
function useAddBlockHandle(editor, anchorElem, isEditable) {
  const scrollerElem = anchorElem.parentElement;
  const {
    editorConfig
  } = useEditorConfigContext();
  const blockHandleHorizontalOffset = editorConfig?.admin?.hideGutter ? -24 : 12;
  const menuRef = useRef(null);
  const [hoveredElement, setHoveredElement] = useState(null);
  useEffect(() => {
    function onDocumentMouseMove(event) {
      const target = event.target;
      if (!isHTMLElement(target)) {
        return;
      }
      const distanceFromScrollerElem = calculateDistanceFromScrollerElem(scrollerElem, event.pageX, event.pageY, target);
      if (distanceFromScrollerElem === -1) {
        setHoveredElement(null);
        return;
      }
      if (isOnHandleElement(target, ADD_BLOCK_MENU_CLASSNAME)) {
        return;
      }
      const topLevelNodeKeys = getTopLevelNodeKeys(editor);
      const {
        blockElem: _emptyBlockElem,
        blockNode,
        foundAtIndex
      } = getNodeCloseToPoint({
        anchorElem,
        cache_threshold: 0,
        editor,
        horizontalOffset: -distanceFromScrollerElem,
        point: new Point(event.x, event.y),
        returnEmptyParagraphs: true,
        startIndex: getCurrentIndex(topLevelNodeKeys.length),
        useEdgeAsDefault: false
      });
      prevIndex = foundAtIndex;
      if (!_emptyBlockElem) {
        return;
      }
      if (blockNode && (hoveredElement?.node !== blockNode || hoveredElement?.elem !== _emptyBlockElem)) {
        setHoveredElement({
          elem: _emptyBlockElem,
          node: blockNode
        });
      }
    }
    // Since the draggableBlockElem is outside the actual editor, we need to listen to the document
    // to be able to detect when the mouse is outside the editor and respect a buffer around
    // the scrollerElem to avoid the draggableBlockElem disappearing too early.
    document?.addEventListener('mousemove', onDocumentMouseMove);
    return () => {
      document?.removeEventListener('mousemove', onDocumentMouseMove);
    };
  }, [scrollerElem, anchorElem, editor, hoveredElement]);
  useEffect(() => {
    if (menuRef.current && hoveredElement?.node) {
      setHandlePosition(hoveredElement?.elem, menuRef.current, anchorElem, blockHandleHorizontalOffset);
    }
  }, [anchorElem, hoveredElement, blockHandleHorizontalOffset]);
  const handleAddClick = useCallback(event_0 => {
    let hoveredElementToUse = hoveredElement;
    if (!hoveredElementToUse?.node) {
      return;
    }
    // 1. Update hoveredElement.node to a new paragraph node if the hoveredElement.node is not a paragraph node
    editor.update(() => {
      // Check if blockNode is an empty text node
      let isEmptyParagraph = true;
      if (hoveredElementToUse?.node.getType() !== 'paragraph' || hoveredElementToUse.node.getTextContent() !== '') {
        isEmptyParagraph = false;
      }
      if (!isEmptyParagraph) {
        const newParagraph = $createParagraphNode();
        hoveredElementToUse?.node.insertAfter(newParagraph);
        setTimeout(() => {
          hoveredElementToUse = {
            elem: editor.getElementByKey(newParagraph.getKey()),
            node: newParagraph
          };
          setHoveredElement(hoveredElementToUse);
        }, 0);
      }
    });
    // 2. Focus on the new paragraph node
    setTimeout(() => {
      editor.update(() => {
        editor.focus();
        if (hoveredElementToUse?.node && 'select' in hoveredElementToUse.node && typeof hoveredElementToUse.node.select === 'function') {
          hoveredElementToUse.node.select();
        }
      });
    }, 1);
    // Make sure this is called AFTER the focusing has been processed by the browser
    // Otherwise, this won't work
    setTimeout(() => {
      editor.dispatchCommand(ENABLE_SLASH_MENU_COMMAND, {
        node: hoveredElementToUse?.node
      });
    }, 2);
    event_0.stopPropagation();
    event_0.preventDefault();
  }, [editor, hoveredElement]);
  return /*#__PURE__*/createPortal(/*#__PURE__*/_jsx(React.Fragment, {
    children: /*#__PURE__*/_jsx("button", {
      "aria-label": "Add block",
      className: "icon add-block-menu",
      onClick: event_1 => {
        handleAddClick(event_1);
      },
      ref: menuRef,
      type: "button",
      children: /*#__PURE__*/_jsx("div", {
        className: isEditable ? 'icon' : ''
      })
    })
  }), anchorElem);
}
export function AddBlockHandlePlugin(t0) {
  const {
    anchorElem: t1
  } = t0;
  const anchorElem = t1 === undefined ? document.body : t1;
  const [editor] = useLexicalComposerContext();
  return useAddBlockHandle(editor, anchorElem, editor._editable);
}
//# sourceMappingURL=index.js.map