import type { SanitizedCollectionConfig } from 'payload';
import React from 'react';
import type { DocumentDrawerContextType } from '../DocumentDrawer/Provider.js';
export type Props = {
    readonly buttonId?: string;
    readonly collectionSlug: SanitizedCollectionConfig['slug'];
    readonly id?: string;
    readonly onDelete?: DocumentDrawerContextType['onDelete'];
    readonly redirectAfterDelete?: boolean;
    readonly singularLabel: SanitizedCollectionConfig['labels']['singular'];
    readonly title?: string;
};
export declare const PermanentlyDeleteButton: React.FC<Props>;
//# sourceMappingURL=index.d.ts.map