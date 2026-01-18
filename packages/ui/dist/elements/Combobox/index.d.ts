import React from 'react';
import type { PopupProps } from '../Popup/index.js';
import './index.scss';
/**
 * @internal
 * @experimental
 */
export type ComboboxEntry = {
    Component: React.ReactNode;
    name: string;
};
/**
 * @internal
 * @experimental
 */
export type ComboboxProps = {
    entries: ComboboxEntry[];
    /** Minimum number of entries required to show search */
    minEntriesForSearch?: number;
    onSelect?: (entry: ComboboxEntry) => void;
    searchPlaceholder?: string;
} & Omit<PopupProps, 'children' | 'render'>;
/**
 * A wrapper on top of Popup + PopupList.ButtonGroup that adds search functionality.
 *
 * @internal - this component may be removed or receive breaking changes in minor releases.
 * @experimental
 */
export declare const Combobox: React.FC<ComboboxProps>;
//# sourceMappingURL=index.d.ts.map