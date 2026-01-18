import type { ClientCollectionConfig, ClientGlobalConfig, SanitizedCollectionConfig } from 'payload';
import './index.scss';
import React from 'react';
type Props = {
    className?: string;
    collectionConfig?: ClientCollectionConfig;
    globalConfig?: ClientGlobalConfig;
    label: SanitizedCollectionConfig['labels']['singular'];
    originalDocID: number | string;
    status?: string;
    versionDateFormatted: string;
    versionID: string;
};
export declare const Restore: React.FC<Props>;
export {};
//# sourceMappingURL=index.d.ts.map