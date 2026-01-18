'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useListDrawer, useModal } from '@payloadcms/ui';
import { $getNodeByKey, $getPreviousSelection, $getRoot, $getSelection, $isRangeSelection, $setSelection } from 'lexical';
import { useCallback, useEffect, useState } from 'react';
/**
 *
 * Wrapper around useListDrawer that restores and saves selection state (cursor position) when opening and closing the drawer.
 * By default, the lexical cursor position may be lost when opening a drawer and clicking somewhere on that drawer.
 */
export const useLexicalListDrawer = args => {
  const $ = _c(23);
  const [editor] = useLexicalComposerContext();
  const [selectionState, setSelectionState] = useState(null);
  const [wasOpen, setWasOpen] = useState(false);
  const [BaseListDrawer, BaseListDrawerToggler, t0] = useListDrawer(args);
  const {
    closeDrawer: baseCloseDrawer,
    drawerSlug: listDrawerSlug,
    isDrawerOpen,
    openDrawer: baseOpenDrawer
  } = t0;
  const {
    modalState
  } = useModal();
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      const selection = $getSelection() ?? $getPreviousSelection();
      setSelectionState(selection);
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const $storeSelection = t1;
  let t2;
  if ($[1] !== editor || $[2] !== selectionState) {
    t2 = () => {
      if (selectionState) {
        editor.update(() => {
          if ($isRangeSelection(selectionState)) {
            const {
              anchor,
              focus
            } = selectionState;
            if ($getNodeByKey(anchor.key) && $getNodeByKey(focus.key)) {
              $setSelection(selectionState.clone());
            }
          } else {
            $getRoot().selectEnd();
          }
        }, {
          discrete: true,
          skipTransforms: true
        });
      }
    };
    $[1] = editor;
    $[2] = selectionState;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const restoreSelection = t2;
  let t3;
  if ($[4] !== baseCloseDrawer) {
    t3 = () => {
      baseCloseDrawer();
    };
    $[4] = baseCloseDrawer;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const closeListDrawer = t3;
  let t4;
  let t5;
  if ($[6] !== listDrawerSlug || $[7] !== modalState || $[8] !== restoreSelection || $[9] !== wasOpen) {
    t4 = () => {
      if (!wasOpen) {
        return;
      }
      const thisModalState = modalState[listDrawerSlug];
      if (thisModalState && !thisModalState?.isOpen) {
        setWasOpen(false);
        setTimeout(() => {
          restoreSelection();
        }, 1);
      }
    };
    t5 = [modalState, listDrawerSlug, restoreSelection, wasOpen];
    $[6] = listDrawerSlug;
    $[7] = modalState;
    $[8] = restoreSelection;
    $[9] = wasOpen;
    $[10] = t4;
    $[11] = t5;
  } else {
    t4 = $[10];
    t5 = $[11];
  }
  useEffect(t4, t5);
  let t6;
  if ($[12] !== BaseListDrawerToggler) {
    t6 = props => _jsx(BaseListDrawerToggler, {
      ...props,
      onClick: () => {
        $storeSelection();
      }
    });
    $[12] = BaseListDrawerToggler;
    $[13] = t6;
  } else {
    t6 = $[13];
  }
  let t7;
  if ($[14] !== baseOpenDrawer) {
    t7 = () => {
      $storeSelection();
      baseOpenDrawer();
      setWasOpen(true);
    };
    $[14] = baseOpenDrawer;
    $[15] = t7;
  } else {
    t7 = $[15];
  }
  let t8;
  if ($[16] !== BaseListDrawer || $[17] !== closeListDrawer || $[18] !== isDrawerOpen || $[19] !== listDrawerSlug || $[20] !== t6 || $[21] !== t7) {
    t8 = {
      closeListDrawer,
      isListDrawerOpen: isDrawerOpen,
      ListDrawer: BaseListDrawer,
      listDrawerSlug,
      ListDrawerToggler: t6,
      openListDrawer: t7
    };
    $[16] = BaseListDrawer;
    $[17] = closeListDrawer;
    $[18] = isDrawerOpen;
    $[19] = listDrawerSlug;
    $[20] = t6;
    $[21] = t7;
    $[22] = t8;
  } else {
    t8 = $[22];
  }
  return t8;
};
//# sourceMappingURL=useLexicalListDrawer.js.map