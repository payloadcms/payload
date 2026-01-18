'use client';

import { c as _c } from "react/compiler-runtime";
import { useModal } from '@faceless-ui/modal';
import { setsAreEqual } from 'payload/shared';
import { useCallback, useEffect } from 'react';
// Required to be outside of hook, else debounce would be necessary
// and then one could not prevent the default behaviour.
// It maps the pressed keys with the time they were pressed, in order to implement a maximum time
// for the user to press the next key in the sequence
// This is necessary to prevent a bug where the keyup event, which unsets the key as pressed
// is not fired when the window is not focused.
// When the user then comes back to the window, the key is still registered as pressed, even though it's not.
const pressedKeys = new Map([]);
const map = {
  altleft: 'alt',
  altright: 'alt',
  controlleft: 'ctrl',
  controlright: 'ctrl',
  ctrlleft: 'ctrl',
  ctrlright: 'ctrl',
  escape: 'esc',
  metaleft: 'meta',
  metaright: 'meta',
  osleft: 'meta',
  osright: 'meta',
  shiftleft: 'shift',
  shiftright: 'shift'
};
const stripKey = key => {
  return (map[key.toLowerCase()] || key).trim().toLowerCase().replace('key', '');
};
const pushToKeys = code => {
  const key = stripKey(code);
  // There is a weird bug with macos that if the keys are not cleared they remain in the
  // pressed keys set.
  if (key === 'meta') {
    pressedKeys.forEach((time, pressedKey) => pressedKey !== 'meta' && pressedKeys.delete(pressedKey));
  }
  pressedKeys.set(key, Date.now());
};
const removeFromKeys = code => {
  const key = stripKey(code);
  // There is a weird bug with macos that if the keys are not cleared they remain in the
  // pressed keys set.
  if (key === 'meta') {
    pressedKeys.clear();
  }
  pressedKeys.delete(key);
};
/**
 * Hook function to work with hotkeys.
 * @param param0.keyCode {string[]} The keys to listen for (`Event.code` without `'Key'` and lowercased)
 * @param param0.cmdCtrlKey {boolean} Whether Ctrl on windows or Cmd on mac must be pressed
 * @param param0.editDepth {boolean} This ensures that the hotkey is only triggered for the most top-level drawer in case there are nested drawers
 * @param func The callback function
 */
export const useHotkey = (options, func) => {
  const $ = _c(9);
  const {
    cmdCtrlKey,
    editDepth,
    keyCodes
  } = options;
  const {
    modalState
  } = useModal();
  let t0;
  if ($[0] !== cmdCtrlKey || $[1] !== editDepth || $[2] !== func || $[3] !== keyCodes || $[4] !== modalState) {
    t0 = event => {
      const e = event.detail?.key ? event.detail : event;
      if (e.key === undefined) {
        return;
      }
      pressedKeys.forEach(_temp);
      if (e.code) {
        pushToKeys(e.code);
      }
      const hasCmd = window.navigator.userAgent.includes("Mac OS X");
      const pressedWithoutModifier = [...pressedKeys.keys()].filter(_temp2);
      if (setsAreEqual(new Set(pressedWithoutModifier), new Set(keyCodes)) && (!cmdCtrlKey || hasCmd && pressedKeys.has("meta") || !hasCmd && e.ctrlKey)) {
        const maxEditDepth = Object.keys(modalState).filter(key_1 => modalState[key_1]?.isOpen)?.length + 1 || 1;
        if (maxEditDepth !== editDepth) {
          return;
        }
        func(e);
      }
    };
    $[0] = cmdCtrlKey;
    $[1] = editDepth;
    $[2] = func;
    $[3] = keyCodes;
    $[4] = modalState;
    $[5] = t0;
  } else {
    t0 = $[5];
  }
  const keydown = t0;
  const keyup = _temp3;
  let t1;
  let t2;
  if ($[6] !== keydown) {
    t1 = () => {
      document.addEventListener("keydown", keydown, false);
      document.addEventListener("bypassKeyDown", keydown, false);
      document.addEventListener("keyup", keyup, false);
      return () => {
        document.removeEventListener("keydown", keydown);
        document.removeEventListener("bypassKeyDown", keydown);
        document.removeEventListener("keyup", keyup);
      };
    };
    t2 = [keydown, keyup];
    $[6] = keydown;
    $[7] = t1;
    $[8] = t2;
  } else {
    t1 = $[7];
    t2 = $[8];
  }
  useEffect(t1, t2);
};
function _temp(time, key) {
  if (Date.now() - time > 3000) {
    pressedKeys.delete(key);
  }
}
function _temp2(key_0) {
  return !["alt", "ctrl", "meta", "shift"].includes(key_0);
}
function _temp3(e_0) {
  if (e_0.code) {
    removeFromKeys(e_0.code);
  }
}
//# sourceMappingURL=useHotkey.js.map