import type { DocumentTabConfig, PayloadRequest, SanitizedCollectionConfig, SanitizedGlobalConfig, SanitizedPermissions } from 'payload';
import type React from 'react';
import './index.scss';
export declare const baseClass = "doc-tab";
export declare const DefaultDocumentTab: React.FC<{
    apiURL?: string;
    collectionConfig?: SanitizedCollectionConfig;
    globalConfig?: SanitizedGlobalConfig;
    path?: string;
    permissions?: SanitizedPermissions;
    req: PayloadRequest;
    tabConfig: {
        readonly Pill_Component?: React.FC;
    } & DocumentTabConfig;
}>;
//# sourceMappingURL=index.d.ts.map