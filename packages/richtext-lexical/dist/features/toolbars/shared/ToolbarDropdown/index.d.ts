import React from 'react';
import type { LexicalEditor } from 'lexical';
import type { ToolbarDropdownGroup, ToolbarGroupItem } from '../../types.js';
import './index.scss';
export declare const ToolbarDropdown: ({ anchorElem, classNames, editor, group, Icon, itemsContainerClassNames, label, maxActiveItems, onActiveChange, }: {
    anchorElem: HTMLElement;
    classNames?: string[];
    editor: LexicalEditor;
    group: ToolbarDropdownGroup;
    Icon?: React.FC;
    itemsContainerClassNames?: string[];
    label?: string;
    /**
     * Maximum number of active items allowed. This is a performance optimization to prevent
     * unnecessary item active checks when the maximum number of active items is reached.
     */
    maxActiveItems?: number;
    onActiveChange?: ({ activeItems }: {
        activeItems: ToolbarGroupItem[];
    }) => void;
}) => React.JSX.Element;
//# sourceMappingURL=index.d.ts.map