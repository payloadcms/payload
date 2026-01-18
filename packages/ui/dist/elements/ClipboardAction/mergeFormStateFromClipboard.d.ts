import type { FieldState, FormState } from 'payload';
import type { ClipboardPasteData } from './types.js';
export declare function reduceFormStateByPath({ formState, path, rowIndex, }: {
    formState: FormState;
    path: string;
    rowIndex?: number;
}): Record<string, FieldState>;
export declare function mergeFormStateFromClipboard({ dataFromClipboard: clipboardData, formState, path, rowIndex, }: {
    dataFromClipboard: ClipboardPasteData;
    formState: FormState;
    path: string;
    rowIndex?: number;
}): FormState;
//# sourceMappingURL=mergeFormStateFromClipboard.d.ts.map