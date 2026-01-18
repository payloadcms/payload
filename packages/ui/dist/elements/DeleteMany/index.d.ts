import type { ClientCollectionConfig, ViewTypes, Where } from 'payload';
import React from 'react';
import './index.scss';
export type Props = {
    collection: ClientCollectionConfig;
    /**
     * When multiple DeleteMany components are rendered on the page, this will differentiate them.
     */
    modalPrefix?: string;
    /**
     * When multiple PublishMany components are rendered on the page, this will differentiate them.
     */
    title?: string;
    viewType?: ViewTypes;
};
export declare const DeleteMany: React.FC<Props>;
type AfterDeleteResult = {
    [relationTo: string]: {
        deletedCount: number;
        errors: unknown[];
        ids: (number | string)[];
        totalCount: number;
    };
};
type DeleteMany_v4Props = {
    /**
     * A callback function to be called after the delete request is completed.
     */
    afterDelete?: (result: AfterDeleteResult) => void;
    /**
     * When multiple DeleteMany components are rendered on the page, this will differentiate them.
     */
    modalPrefix?: string;
    /**
     * Optionally pass a search string to filter the documents to be deleted.
     *
     * This is intentionally passed as a prop so modals could pass in their own
     * search string that may not be stored in the URL.
     */
    search?: string;
    /**
     * An object containing the relationTo as the key and an object with the following properties:
     * - all: boolean
     * - totalCount: number
     * - ids: (string | number)[]
     */
    selections: {
        [relationTo: string]: {
            all?: boolean;
            ids?: (number | string)[];
            totalCount?: number;
        };
    };
    trash?: boolean;
    viewType?: ViewTypes;
    /**
     * Optionally pass a where clause to filter the documents to be deleted.
     * This will be ignored if multiple relations are selected.
     *
     * This is intentionally passed as a prop so modals could pass in their own
     * where clause that may not be stored in the URL.
     */
    where?: Where;
};
/**
 * Handles polymorphic document delete operations.
 *
 * If you are deleting monomorphic documents, shape your `selections` to match the polymorphic structure.
 */
export declare function DeleteMany_v4({ afterDelete, modalPrefix, search, selections, trash, viewType, where, }: DeleteMany_v4Props): React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map