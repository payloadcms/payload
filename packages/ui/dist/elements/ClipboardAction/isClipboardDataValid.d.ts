import type { ClipboardPasteActionValidateArgs } from './types.js';
/**
 * Validates whether clipboard data is compatible with the target schema.
 * For this to be true, the copied field and the target to be pasted must
 * be structurally equivalent (same schema)
 *
 * @returns True if the clipboard data is valid and can be pasted, false otherwise
 */
export declare function isClipboardDataValid({ data, path, ...args }: ClipboardPasteActionValidateArgs): boolean;
//# sourceMappingURL=isClipboardDataValid.d.ts.map