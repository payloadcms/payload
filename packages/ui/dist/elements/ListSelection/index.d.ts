import React from 'react';
import type { Props as ButtonProps } from '../Button/types.js';
import './index.scss';
type ListSelection_v4Props = {
    /**
     * The count of selected items
     */
    readonly count: number;
    /**
     * Actions that apply to the list as a whole
     *
     * @example select all, clear selection
     */
    readonly ListActions?: React.ReactNode[];
    /**
     * Actions that apply to the selected items
     *
     * @example edit, delete, publish, unpublish
     */
    readonly SelectionActions?: React.ReactNode[];
};
export declare function ListSelection_v4({ count, ListActions, SelectionActions }: ListSelection_v4Props): React.JSX.Element;
type ListSelectionButtonProps = {} & ButtonProps;
export declare function ListSelectionButton({ children, className, ...props }: ListSelectionButtonProps): React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map