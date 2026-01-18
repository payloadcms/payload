import type { SanitizedCollectionConfig } from 'payload';
import React from 'react';
import type { DocumentDrawerContextType } from '../DocumentDrawer/Provider.js';
export type Props = {
    readonly id: number | string;
    readonly onDuplicate?: DocumentDrawerContextType['onDuplicate'];
    readonly redirectAfterDuplicate?: boolean;
    readonly selectLocales?: boolean;
    readonly singularLabel: SanitizedCollectionConfig['labels']['singular'];
    readonly slug: string;
};
export declare const DuplicateDocument: React.FC<Props>;
//# sourceMappingURL=index.d.ts.map