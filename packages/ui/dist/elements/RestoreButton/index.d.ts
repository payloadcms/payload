import type { SanitizedCollectionConfig } from 'payload';
import React from 'react';
import type { DocumentDrawerContextType } from '../DocumentDrawer/Provider.js';
import './index.scss';
export type Props = {
    readonly buttonId?: string;
    readonly collectionSlug: SanitizedCollectionConfig['slug'];
    readonly id?: string;
    readonly onRestore?: DocumentDrawerContextType['onRestore'];
    readonly redirectAfterRestore?: boolean;
    readonly singularLabel: SanitizedCollectionConfig['labels']['singular'];
    readonly title?: string;
};
export declare const RestoreButton: React.FC<Props>;
//# sourceMappingURL=index.d.ts.map