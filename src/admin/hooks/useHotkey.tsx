/* eslint-disable no-shadow */
import _ from 'lodash';
import { useCallback, useEffect } from 'react';

// Required to be outside of hook, else debounce would be necessary
// and then one could not prevent the default behaviour.
const pressedKeys = new Set([]);

const map = {
  MetaLeft: 'meta',
  MetaRight: 'meta',
  OSLeft: 'meta',
  OSRight: 'meta',
  ShiftLeft: 'shift',
  ShiftRight: 'shift',
  CtrlLeft: 'ctrl',
  CtrlRight: 'ctrl',
  AltLeft: 'alt',
  AltRight: 'alt',
  Escape: 'esc',
};

const stripKey = (key: string) => {
  return (map[key] || key).trim()
    .toLowerCase()
    .replace('key', '');
};

const pushToKeys = (code: string) => {
  const key = stripKey(code);

  // There is a weird bug with macos that if the keys are not cleared they remain in the
  // pressed keys set.
  if (key === 'meta') {
    pressedKeys.forEach((pressedKey) => pressedKey !== 'meta' && pressedKeys.delete(pressedKey));
  }

  pressedKeys.add(key);
};

const removeFromKeys = (code: string) => {
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
 * @param func The callback function
 */
const useHotkey = (options: {
  keyCodes: string[]
  cmdCtrlKey: boolean
}, func: (e, deps: any[]) => void, deps: any[]): void => {
  const { keyCodes, cmdCtrlKey } = options;

  const keydown = useCallback((e: KeyboardEvent) => {
    if (e.key === undefined) {
      // Autofill events, or other synthetic events, can be ignored
      return;
    }
    pushToKeys(e.code);

    // Check for Mac and iPad
    const hasCmd = window.navigator.userAgent.includes('Mac OS X');
    const pressedWithoutMeta = [...pressedKeys].filter((key) => key !== 'meta');

    // Check whether arrays contain the same values (regardless of number of occurrences)
    if (
      _.isEmpty(_.xor(pressedWithoutMeta, keyCodes))
      && (!cmdCtrlKey || (hasCmd && pressedKeys.has('meta')) || (!hasCmd && e.ctrlKey))
    ) {
      func(e, deps);
    }
  }, [keyCodes, cmdCtrlKey, func, deps]);

  const keyup = useCallback((e) => {
    removeFromKeys(e.code);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', keydown, false);
    document.addEventListener('keyup', keyup, false);

    return () => {
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('keyup', keyup);
    };
  }, [keydown, keyup]);
};

export default useHotkey;
