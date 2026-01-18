import type { ClientField, SanitizedDocumentPermissions } from 'payload';
import React from 'react';
import './index.scss';
type Args = {
    readonly AfterFields?: React.ReactNode;
    readonly BeforeFields?: React.ReactNode;
    readonly Description?: React.ReactNode;
    readonly docPermissions: SanitizedDocumentPermissions;
    readonly fields: ClientField[];
    readonly forceSidebarWrap?: boolean;
    readonly isTrashed?: boolean;
    readonly readOnly?: boolean;
    readonly schemaPathSegments: string[];
};
export declare const DocumentFields: React.FC<Args>;
export {};
//# sourceMappingURL=index.d.ts.map