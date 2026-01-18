import type { FormStateWithoutComponents } from 'payload';
import { type FC } from 'react';
import type { ClipboardCopyData, OnPasteFn } from './types.js';
type Props = {
    allowCopy?: boolean;
    allowPaste?: boolean;
    className?: string;
    copyClassName?: string;
    disabled?: boolean;
    getDataToCopy: () => FormStateWithoutComponents;
    isRow?: boolean;
    onPaste: OnPasteFn;
    pasteClassName?: string;
} & ClipboardCopyData;
/**
 * Menu actions for copying and pasting fields. Currently, this is only used in Arrays and Blocks.
 * @note This component doesn't use the Clipboard API, but localStorage. See rationale in #11513
 */
export declare const ClipboardAction: FC<Props>;
export {};
//# sourceMappingURL=index.d.ts.map