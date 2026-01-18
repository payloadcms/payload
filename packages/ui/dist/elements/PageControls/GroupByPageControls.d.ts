import type { ClientCollectionConfig, PaginatedDocs } from 'payload';
import React from 'react';
/**
 * If `groupBy` is set in the query, multiple tables will render, one for each group.
 * In this case, each table needs its own `PageControls` to handle pagination.
 * These page controls, however, should not modify the global `ListQuery` state.
 * Instead, they should only handle the pagination for the current group.
 * To do this, build a wrapper around `PageControlsComponent` that handles the pagination logic for the current group.
 */
export declare const GroupByPageControls: React.FC<{
    AfterPageControls?: React.ReactNode;
    collectionConfig: ClientCollectionConfig;
    data: PaginatedDocs;
    groupByValue?: number | string;
}>;
//# sourceMappingURL=GroupByPageControls.d.ts.map