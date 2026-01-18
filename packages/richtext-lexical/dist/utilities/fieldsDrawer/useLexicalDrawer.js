'use client';

import { c as _c } from "react/compiler-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useModal } from '@payloadcms/ui';
import { $getPreviousSelection, $getSelection, $setSelection } from 'lexical';
import { useCallback, useEffect, useState } from 'react';
/**
 *
 * Wrapper around useModal that restores and saves selection state (cursor position) when opening and closing the drawer.
 * By default, the lexical cursor position may be lost when opening a drawer and clicking somewhere on that drawer.
 */
export const useLexicalDrawer = (slug, restoreLate) => {
  const $ = _c(24);
  const [editor] = useLexicalComposerContext();
  const [selectionState, setSelectionState] = useState(null);
  const [wasOpen, setWasOpen] = useState(false);
  const {
    closeModal: closeBaseModal,
    modalState,
    toggleModal: toggleBaseModal
  } = useModal();
  let t0;
  if ($[0] !== editor) {
    t0 = () => {
      editor.read(() => {
        const selection = $getSelection() ?? $getPreviousSelection();
        setSelectionState(selection);
      });
    };
    $[0] = editor;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const storeSelection = t0;
  let t1;
  if ($[2] !== editor || $[3] !== selectionState) {
    t1 = () => {
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
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const restoreSelection = t1;
  let t2;
  if ($[5] !== closeBaseModal || $[6] !== slug) {
    t2 = () => {
      closeBaseModal(slug);
    };
    $[5] = closeBaseModal;
    $[6] = slug;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  const closeDrawer = t2;
  const isModalOpen = modalState?.[slug]?.isOpen;
  let t3;
  if ($[8] !== isModalOpen || $[9] !== restoreSelection || $[10] !== slug || $[11] !== storeSelection || $[12] !== toggleBaseModal) {
    t3 = () => {
      if (!isModalOpen) {
        storeSelection();
      } else {
        restoreSelection();
      }
      setWasOpen(true);
      toggleBaseModal(slug);
    };
    $[8] = isModalOpen;
    $[9] = restoreSelection;
    $[10] = slug;
    $[11] = storeSelection;
    $[12] = toggleBaseModal;
    $[13] = t3;
  } else {
    t3 = $[13];
  }
  const toggleDrawer = t3;
  let t4;
  let t5;
  if ($[14] !== modalState || $[15] !== restoreLate || $[16] !== restoreSelection || $[17] !== slug || $[18] !== wasOpen) {
    t4 = () => {
      if (!wasOpen) {
        return;
      }
      const thisModalState = modalState[slug];
      if (thisModalState && !thisModalState?.isOpen) {
        setWasOpen(false);
        if (restoreLate) {
          setTimeout(() => {
            restoreSelection();
          }, 0);
        } else {
          restoreSelection();
        }
      }
    };
    t5 = [modalState, slug, restoreSelection, wasOpen, restoreLate];
    $[14] = modalState;
    $[15] = restoreLate;
    $[16] = restoreSelection;
    $[17] = slug;
    $[18] = wasOpen;
    $[19] = t4;
    $[20] = t5;
  } else {
    t4 = $[19];
    t5 = $[20];
  }
  useEffect(t4, t5);
  let t6;
  if ($[21] !== closeDrawer || $[22] !== toggleDrawer) {
    t6 = {
      closeDrawer,
      toggleDrawer
    };
    $[21] = closeDrawer;
    $[22] = toggleDrawer;
    $[23] = t6;
  } else {
    t6 = $[23];
  }
  return t6;
};
//# sourceMappingURL=useLexicalDrawer.js.map