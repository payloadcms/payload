import type { ClientCollectionConfig, Where } from 'payload';
import React from 'react';
export type PublishManyProps = {
    collection: ClientCollectionConfig;
};
export declare const PublishMany: React.FC<PublishManyProps>;
type PublishMany_v4Props = {
    count: number;
    ids: (number | string)[];
    /**
     * When multiple PublishMany components are rendered on the page, this will differentiate them.
     */
    modalPrefix?: string;
    onSuccess?: () => void;
    selectAll: boolean;
    where?: Where;
} & PublishManyProps;
export declare const PublishMany_v4: React.FC<PublishMany_v4Props>;
export {};
//# sourceMappingURL=index.d.ts.map