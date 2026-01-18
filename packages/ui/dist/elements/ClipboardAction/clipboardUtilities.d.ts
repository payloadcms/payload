import type { ClipboardCopyActionArgs, ClipboardPasteActionArgs } from './types.js';
/**
 * @note This function doesn't use the Clipboard API, but localStorage. See rationale in #11513
 */
export declare function clipboardCopy(args: ClipboardCopyActionArgs): string | true;
/**
 * @note This function doesn't use the Clipboard API, but localStorage. See rationale in #11513
 */
export declare function clipboardPaste({ onPaste, path: fieldPath, t, ...args }: ClipboardPasteActionArgs): string | true;
//# sourceMappingURL=clipboardUtilities.d.ts.map