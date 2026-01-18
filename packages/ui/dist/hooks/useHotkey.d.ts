/**
 * Hook function to work with hotkeys.
 * @param param0.keyCode {string[]} The keys to listen for (`Event.code` without `'Key'` and lowercased)
 * @param param0.cmdCtrlKey {boolean} Whether Ctrl on windows or Cmd on mac must be pressed
 * @param param0.editDepth {boolean} This ensures that the hotkey is only triggered for the most top-level drawer in case there are nested drawers
 * @param func The callback function
 */
export declare const useHotkey: (options: {
    cmdCtrlKey: boolean;
    editDepth: number;
    keyCodes: string[];
}, func: (e: KeyboardEvent) => void) => void;
//# sourceMappingURL=useHotkey.d.ts.map