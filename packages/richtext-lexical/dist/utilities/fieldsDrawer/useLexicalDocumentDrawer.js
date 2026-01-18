'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useDocumentDrawer, useModal } from '@payloadcms/ui';
import { $getPreviousSelection, $getSelection, $setSelection } from 'lexical';
import { useCallback, useEffect, useState } from 'react';
/**
 *
 * Wrapper around useDocumentDrawer that restores and saves selection state (cursor position) when opening and closing the drawer.
 * By default, the lexical cursor position may be lost when opening a drawer and clicking somewhere on that drawer.
 */
export const useLexicalDocumentDrawer = args => {
  const $ = _c(21);
  const [editor] = useLexicalComposerContext();
  const [selectionState, setSelectionState] = useState(null);
  const [wasOpen, setWasOpen] = useState(false);
  const [DocumentDrawer, DocumentDrawerToggler, t0] = useDocumentDrawer(args);
  const {
    closeDrawer,
    drawerSlug: documentDrawerSlug
  } = t0;
  const {
    modalState
  } = useModal();
  let t1;
  if ($[0] !== editor) {
    t1 = () => {
      editor.read(() => {
        const selection = $getSelection() ?? $getPreviousSelection();
        setSelectionState(selection);
      });
      setWasOpen(true);
    };
    $[0] = editor;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const storeSelection = t1;
  let t2;
  if ($[2] !== editor || $[3] !== selectionState) {
    t2 = () => {
      if (selectionState) {
        editor.update(() => {
          $setSelection(selectionState.clone());
        }, {
          discrete: true,
          skipTransforms: true
        });
      }
    };
    $[2] = editor;
    $[3] = selectionState;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const restoreSelection = t2;
  let t3;
  if ($[5] !== closeDrawer) {
    t3 = () => {
      closeDrawer();
    };
    $[5] = closeDrawer;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const closeDocumentDrawer = t3;
  let t4;
  let t5;
  if ($[7] !== documentDrawerSlug || $[8] !== modalState || $[9] !== restoreSelection || $[10] !== wasOpen) {
    t4 = () => {
      if (!wasOpen) {
        return;
      }
      const thisModalState = modalState[documentDrawerSlug];
      if (thisModalState && !thisModalState?.isOpen) {
        setWasOpen(false);
        setTimeout(() => {
          restoreSelection();
        }, 1);
      }
    };
    t5 = [modalState, documentDrawerSlug, restoreSelection, wasOpen];
    $[7] = documentDrawerSlug;
    $[8] = modalState;
    $[9] = restoreSelection;
    $[10] = wasOpen;
    $[11] = t4;
    $[12] = t5;
  } else {
    t4 = $[11];
    t5 = $[12];
  }
  useEffect(t4, t5);
  let t6;
  if ($[13] !== DocumentDrawerToggler || $[14] !== storeSelection) {
    t6 = props => _jsx(DocumentDrawerToggler, {
      ...props,
      onClick: storeSelection
    });
    $[13] = DocumentDrawerToggler;
    $[14] = storeSelection;
    $[15] = t6;
  } else {
    t6 = $[15];
  }
  let t7;
  if ($[16] !== DocumentDrawer || $[17] !== closeDocumentDrawer || $[18] !== documentDrawerSlug || $[19] !== t6) {
    t7 = {
      closeDocumentDrawer,
      DocumentDrawer,
      documentDrawerSlug,
      DocumentDrawerToggler: t6
    };
    $[16] = DocumentDrawer;
    $[17] = closeDocumentDrawer;
    $[18] = documentDrawerSlug;
    $[19] = t6;
    $[20] = t7;
  } else {
    t7 = $[20];
  }
  return t7;
};
//# sourceMappingURL=useLexicalDocumentDrawer.js.map