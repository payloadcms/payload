import type { SanitizedCollectionConfig } from 'payload';
import React from 'react';
export type SortComplexProps = {
    collection: SanitizedCollectionConfig;
    handleChange?: (sort: string) => void;
    modifySearchQuery?: boolean;
    sort?: string;
};
import './index.scss';
export declare const SortComplex: React.FC<SortComplexProps>;
//# sourceMappingURL=index.d.ts.map