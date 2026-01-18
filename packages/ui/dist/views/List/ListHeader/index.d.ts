import type { I18nClient, TFunction } from '@payloadcms/translations';
import type { ClientCollectionConfig, ViewTypes } from 'payload';
import React from 'react';
import './index.scss';
export type ListHeaderProps = {
    Actions?: React.ReactNode[];
    className?: string;
    collectionConfig: ClientCollectionConfig;
    Description?: React.ReactNode;
    disableBulkDelete?: boolean;
    disableBulkEdit?: boolean;
    hasCreatePermission: boolean;
    hasDeletePermission?: boolean;
    i18n: I18nClient;
    isBulkUploadEnabled: boolean;
    isTrashEnabled?: boolean;
    newDocumentURL: string;
    onBulkUploadSuccess?: () => void;
    /** @deprecated This prop will be removed in the next major version.
     *
     * Opening of the bulk upload modal is handled internally.
     *
     * Prefer `onBulkUploadSuccess` usage to handle the success of the bulk upload.
     */
    openBulkUpload: () => void;
    smallBreak: boolean;
    /** @deprecated This prop will be removed in the next major version. */
    t?: TFunction;
    TitleActions?: React.ReactNode[];
    viewType?: ViewTypes;
};
export declare const CollectionListHeader: React.FC<ListHeaderProps>;
//# sourceMappingURL=index.d.ts.map