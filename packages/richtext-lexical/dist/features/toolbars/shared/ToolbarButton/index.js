'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { mergeRegister } from '@lexical/utils';
import { $addUpdateTag, $getSelection } from 'lexical';
import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js';
import { useRunDeprioritized } from '../../../../utilities/useRunDeprioritized.js';
const baseClass = 'toolbar-popup__button';
export const ToolbarButton = t0 => {
  const $ = _c(23);
  const {
    children,
    editor,
    item
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {
      active: false,
      enabled: true
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const [_state, setState] = useState(t1);
  const deferredState = useDeferredValue(_state);
  const editorConfigContext = useEditorConfigContext();
  const t2 = !deferredState.enabled ? "disabled" : "";
  const t3 = deferredState.active ? "active" : "";
  const t4 = item.key ? `${baseClass}-${item.key}` : "";
  let t5;
  if ($[1] !== t2 || $[2] !== t3 || $[3] !== t4) {
    t5 = [baseClass, t2, t3, t4].filter(Boolean);
    $[1] = t2;
    $[2] = t3;
    $[3] = t4;
    $[4] = t5;
  } else {
    t5 = $[4];
  }
  const className = t5.join(" ");
  let t6;
  if ($[5] !== editor || $[6] !== editorConfigContext || $[7] !== item) {
    t6 = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!selection) {
          return;
        }
        const newActive = item.isActive ? item.isActive({
          editor,
          editorConfigContext,
          selection
        }) : false;
        const newEnabled = item.isEnabled ? item.isEnabled({
          editor,
          editorConfigContext,
          selection
        }) : true;
        setState(prev => {
          if (prev.active === newActive && prev.enabled === newEnabled) {
            return prev;
          }
          return {
            active: newActive,
            enabled: newEnabled
          };
        });
      });
    };
    $[5] = editor;
    $[6] = editorConfigContext;
    $[7] = item;
    $[8] = t6;
  } else {
    t6 = $[8];
  }
  const updateStates = t6;
  const runDeprioritized = useRunDeprioritized();
  let t7;
  let t8;
  if ($[9] !== editor || $[10] !== runDeprioritized || $[11] !== updateStates) {
    t7 = () => {
      runDeprioritized(updateStates);
      const listener = () => runDeprioritized(updateStates);
      const cleanup = mergeRegister(editor.registerUpdateListener(listener));
      document.addEventListener("mouseup", listener);
      return () => {
        cleanup();
        document.removeEventListener("mouseup", listener);
      };
    };
    t8 = [editor, runDeprioritized, updateStates];
    $[9] = editor;
    $[10] = runDeprioritized;
    $[11] = updateStates;
    $[12] = t7;
    $[13] = t8;
  } else {
    t7 = $[12];
    t8 = $[13];
  }
  useEffect(t7, t8);
  let t9;
  if ($[14] !== _state || $[15] !== editor || $[16] !== item) {
    t9 = () => {
      if (!_state.enabled) {
        return;
      }
      editor.focus(() => {
        editor.update(_temp);
        item.onSelect?.({
          editor,
          isActive: _state.active
        });
      });
    };
    $[14] = _state;
    $[15] = editor;
    $[16] = item;
    $[17] = t9;
  } else {
    t9 = $[17];
  }
  const handleClick = t9;
  const handleMouseDown = _temp2;
  let t10;
  if ($[18] !== children || $[19] !== className || $[20] !== handleClick || $[21] !== item.key) {
    t10 = _jsx("button", {
      className,
      "data-button-key": item.key,
      onClick: handleClick,
      onMouseDown: handleMouseDown,
      type: "button",
      children
    });
    $[18] = children;
    $[19] = className;
    $[20] = handleClick;
    $[21] = item.key;
    $[22] = t10;
  } else {
    t10 = $[22];
  }
  return t10;
};
function _temp() {
  $addUpdateTag("toolbar");
}
function _temp2(e) {
  e.preventDefault();
}
//# sourceMappingURL=index.js.map