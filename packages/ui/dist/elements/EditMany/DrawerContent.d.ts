import type { Where } from 'payload';
import React from 'react';
import type { FieldOption } from '../FieldSelect/reduceFieldOptions.js';
import './index.scss';
import '../../forms/RenderFields/index.scss';
import { type EditManyProps } from './index.js';
type EditManyDrawerContentProps = {
    /**
     * The total count of selected items
     */
    count?: number;
    /**
     * The slug of the drawer
     */
    drawerSlug: string;
    /**
     * The IDs of the selected items
     */
    ids?: (number | string)[];
    /**
     * The function to call after a successful action
     */
    onSuccess?: () => void;
    /**
     * Whether all items are selected
     */
    selectAll?: boolean;
    /**
     * The fields that are selected to bulk edit
     */
    selectedFields: FieldOption[];
    /**
     * The function to set the selected fields to bulk edit
     */
    setSelectedFields: (fields: FieldOption[]) => void;
    where?: Where;
} & EditManyProps;
export declare const EditManyDrawerContent: React.FC<EditManyDrawerContentProps>;
export {};
//# sourceMappingURL=DrawerContent.d.ts.map