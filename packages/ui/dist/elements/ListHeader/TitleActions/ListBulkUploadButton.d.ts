import type { CollectionSlug } from 'payload';
import React from 'react';
export declare function ListBulkUploadButton({ collectionSlug, hasCreatePermission, isBulkUploadEnabled, onBulkUploadSuccess, openBulkUpload: openBulkUploadFromProps, }: {
    collectionSlug: CollectionSlug;
    hasCreatePermission: boolean;
    isBulkUploadEnabled: boolean;
    onBulkUploadSuccess?: () => void;
    /**
     * @deprecated This prop will be removed in the next major version.
     *
     * Prefer using `onBulkUploadSuccess`
     */
    openBulkUpload?: () => void;
}): React.JSX.Element;
//# sourceMappingURL=ListBulkUploadButton.d.ts.map