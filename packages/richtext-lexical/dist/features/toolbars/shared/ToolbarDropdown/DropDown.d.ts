import { type LexicalEditor } from 'lexical';
import React, { type ReactNode } from 'react';
import type { ToolbarGroupItem } from '../../types.js';
export declare function DropDownItem({ active, children, editor, enabled, Icon, item, itemKey, tooltip, }: {
    active?: boolean;
    children: React.ReactNode;
    editor: LexicalEditor;
    enabled?: boolean;
    Icon: React.ReactNode;
    item: ToolbarGroupItem;
    itemKey: string;
    tooltip?: string;
}): React.ReactNode;
export declare function DropDown({ buttonAriaLabel, buttonClassName, children, disabled, dropdownKey, Icon, itemsContainerClassNames, label, stopCloseOnClickSelf, }: {
    buttonAriaLabel?: string;
    buttonClassName: string;
    children: ReactNode;
    disabled?: boolean;
    dropdownKey: string;
    Icon?: React.FC;
    itemsContainerClassNames?: string[];
    label?: string;
    stopCloseOnClickSelf?: boolean;
}): React.ReactNode;
//# sourceMappingURL=DropDown.d.ts.map