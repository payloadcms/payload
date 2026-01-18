import type { ClientCollectionConfig, PaginatedDocs } from 'payload';
import React from 'react';
import type { IListQueryContext } from '../../providers/ListQuery/types.js';
import './index.scss';
/**
 * @internal
 */
export declare const PageControlsComponent: React.FC<{
    AfterPageControls?: React.ReactNode;
    collectionConfig: ClientCollectionConfig;
    data: PaginatedDocs;
    handlePageChange?: IListQueryContext['handlePageChange'];
    handlePerPageChange?: IListQueryContext['handlePerPageChange'];
    limit?: number;
}>;
/**
 * These page controls are controlled by the global ListQuery state.
 * To override thi behavior, build your own wrapper around PageControlsComponent.
 *
 * @internal
 */
export declare const PageControls: React.FC<{
    AfterPageControls?: React.ReactNode;
    collectionConfig: ClientCollectionConfig;
}>;
//# sourceMappingURL=index.d.ts.map