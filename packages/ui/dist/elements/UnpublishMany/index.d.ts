import type { ClientCollectionConfig, Where } from 'payload';
import React from 'react';
export type UnpublishManyProps = {
    collection: ClientCollectionConfig;
};
export declare const UnpublishMany: React.FC<UnpublishManyProps>;
export declare const UnpublishMany_v4: React.FC<{
    count: number;
    ids: (number | string)[];
    /**
     * When multiple UnpublishMany components are rendered on the page, this will differentiate them.
     */
    modalPrefix?: string;
    onSuccess?: () => void;
    selectAll: boolean;
    where?: Where;
} & UnpublishManyProps>;
//# sourceMappingURL=index.d.ts.map