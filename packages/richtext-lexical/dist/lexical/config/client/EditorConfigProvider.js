'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { useEditDepth } from '@payloadcms/ui';
import * as React from 'react';
import { createContext, use, useMemo, useRef, useState } from 'react';
// Should always produce a 20 character pseudo-random string
function generateQuickGuid() {
  return Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
}
// @ts-expect-error: TODO: Fix this
const Context = /*#__PURE__*/createContext({
  editorConfig: null,
  fieldProps: null,
  uuid: null
});
export const EditorConfigProvider = ({
  children,
  editorConfig,
  editorContainerRef,
  fieldProps,
  parentContext
}) => {
  const [editor] = useLexicalComposerContext();
  // State to store the UUID
  const [uuid] = useState(() => generateQuickGuid());
  const childrenEditors = useRef(new Map());
  const [focusedEditor, setFocusedEditor] = useState(null);
  const focusHistory = useRef(new Set());
  const [createdInlineBlock, setCreatedInlineBlock] = useState();
  const editDepth = useEditDepth();
  const editorContext_1 = useMemo(() => ({
    blurEditor: editorContext => {
      //setFocusedEditor(null) // Clear focused editor
      focusHistory.current.clear(); // Reset focus history when focus is lost
    },
    childrenEditors,
    createdInlineBlock,
    editDepth,
    editor,
    editorConfig,
    editorContainerRef,
    fieldProps,
    focusedEditor,
    focusEditor: editorContext_0 => {
      const editorUUID = editorContext_0.uuid;
      // Avoid recursion by checking if this editor is already focused in this cycle
      if (focusHistory.current.has(editorUUID)) {
        return;
      }
      // Add this editor to the history to prevent future recursions in this cycle
      focusHistory.current.add(editorUUID);
      setFocusedEditor(editorContext_0);
      // Propagate focus event to parent and children, ensuring they do not refocus this editor
      if (parentContext?.uuid) {
        parentContext.focusEditor(editorContext_0);
      }
      childrenEditors.current.forEach(childEditor => {
        childEditor.focusEditor(editorContext_0);
      });
      focusHistory.current.clear();
    },
    parentEditor: parentContext,
    registerChild: (childUUID, childEditorContext) => {
      if (!childrenEditors.current.has(childUUID)) {
        const newMap = new Map(childrenEditors.current);
        newMap.set(childUUID, childEditorContext);
        childrenEditors.current = newMap;
      }
    },
    setCreatedInlineBlock,
    unregisterChild: childUUID_0 => {
      if (childrenEditors.current.has(childUUID_0)) {
        const newMap_0 = new Map(childrenEditors.current);
        newMap_0.delete(childUUID_0);
        childrenEditors.current = newMap_0;
      }
    },
    uuid
  }), [createdInlineBlock, setCreatedInlineBlock, editor, childrenEditors, editorConfig, editorContainerRef, editDepth, fieldProps, focusedEditor, parentContext, uuid]);
  return /*#__PURE__*/_jsx(Context, {
    value: editorContext_1,
    children: children
  });
};
export const useEditorConfigContext = () => {
  const context = use(Context);
  if (context === undefined) {
    throw new Error('useEditorConfigContext must be used within an EditorConfigProvider');
  }
  return context;
};
//# sourceMappingURL=EditorConfigProvider.js.map