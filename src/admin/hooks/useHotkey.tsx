/* eslint-disable no-shadow */
import { useCallback, useEffect } from 'react';
import { setsAreEqual } from '../utilities/setsAreEqual';

// Store the callback functions with their associated edit depths
const hotkeyCallbacks: { [editDepth: number]: (e: KeyboardEvent, deps: boolean[]) => void } = {};

// Required to be outside of hook, else debounce would be necessary
// and then one could not prevent the default behaviour.
const pressedKeys = new Set<string>([]);

const map = {
  metaleft: 'meta',
  metaright: 'meta',
  osleft: 'meta',
  osright: 'meta',
  shiftleft: 'shift',
  shiftright: 'shift',
  ctrlleft: 'ctrl',
  ctrlright: 'ctrl',
  controlleft: 'ctrl',
  controlright: 'ctrl',
  altleft: 'alt',
  altright: 'alt',
  escape: 'esc',
};

const stripKey = (key: string) => {
  return (map[key.toLowerCase()] || key).trim()
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
 * @param param0.editDepth {boolean} This ensures that the hotkey is only triggered for the most top-level drawer in case there are nested drawers
 * @param func The callback function
 */
const useHotkey = (options: {
  keyCodes: string[]
  cmdCtrlKey: boolean
  editDepth: number
}, func: (e: KeyboardEvent, deps: boolean[]) => void, deps: boolean[]): void => {
  const { keyCodes, cmdCtrlKey, editDepth } = options;

  // on mounting of the component, add the callback function to the callbacks object
  useEffect(() => {
    hotkeyCallbacks[editDepth] = func;

    return () => {
      // on unmounting of the component, remove the callback function from the callbacks object
      delete hotkeyCallbacks[editDepth];
    };
  }, [func, editDepth]);


  const keydown = useCallback((event: KeyboardEvent | CustomEvent) => {
    const e: KeyboardEvent = event.detail?.key ? event.detail : event;
    if (e.key === undefined) {
      // Autofill events, or other synthetic events, can be ignored
      return;
    }
    if (e.code) pushToKeys(e.code);

    // Check for Mac and iPad
    const hasCmd = window.navigator.userAgent.includes('Mac OS X');
    const pressedWithoutModifier = [...pressedKeys].filter((key) => key !== 'meta' && key !== 'ctrl' && key !== 'alt' && key !== 'shift');

    // Check whether arrays contain the same values (regardless of number of occurrences)
    if (
      setsAreEqual(new Set(pressedWithoutModifier), new Set(keyCodes))
      && (!cmdCtrlKey || (hasCmd && pressedKeys.has('meta')) || (!hasCmd && e.ctrlKey))
    ) {
      // get the maximum edit depth
      const maxEditDepth = Math.max(...Object.keys(hotkeyCallbacks).map(Number));
      if (maxEditDepth !== editDepth) {
        // We only want to execute the hotkey from the most top-level drawer / edit depth.
        return;
      }

      // execute the function associated with the maximum edit depth
      if (hotkeyCallbacks[maxEditDepth]) {
        hotkeyCallbacks[maxEditDepth](e, deps);
      }
    }
  }, [keyCodes, cmdCtrlKey, deps, editDepth]);

  const keyup = useCallback((e: KeyboardEvent) => {
    if (e.code) removeFromKeys(e.code);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', keydown, false);
    document.addEventListener('bypassKeyDown', keydown, false); // this is called if the keydown event's propagation is stopped by react-select
    document.addEventListener('keyup', keyup, false);

    return () => {
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('bypassKeyDown', keydown);
      document.removeEventListener('keyup', keyup);
    };
  }, [keydown, keyup]);
};

export default useHotkey;
