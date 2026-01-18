import type { AdminViewServerProps, ListQuery, ListViewClientProps, ListViewServerPropsOnly, PayloadComponent } from 'payload';
import React from 'react';
/**
 * @internal
 */
export type RenderListViewArgs = {
    /**
     * Allows providing your own list view component. This will override the default list view component and
     * the collection's configured list view component (if any).
     */
    ComponentOverride?: PayloadComponent | React.ComponentType<ListViewClientProps | (ListViewClientProps & ListViewServerPropsOnly)>;
    customCellProps?: Record<string, any>;
    disableBulkDelete?: boolean;
    disableBulkEdit?: boolean;
    disableQueryPresets?: boolean;
    drawerSlug?: string;
    enableRowSelections: boolean;
    overrideEntityVisibility?: boolean;
    /**
     * If not ListQuery is provided, `req.query` will be used.
     */
    query?: ListQuery;
    redirectAfterDelete?: boolean;
    redirectAfterDuplicate?: boolean;
    /**
     * @experimental This prop is subject to change in future releases.
     */
    trash?: boolean;
} & AdminViewServerProps;
/**
 * This function is responsible for rendering
 * the list view on the server for both:
 *  - default list view
 *  - list view within drawers
 *
 * @internal
 */
export declare const renderListView: (args: RenderListViewArgs) => Promise<{
    List: React.ReactNode;
}>;
export declare const ListView: React.FC<RenderListViewArgs>;
//# sourceMappingURL=index.d.ts.map