import type { ClientCollectionConfig, Where } from 'payload';
import React from 'react';
import './index.scss';
export declare const baseClass = "edit-many";
export type EditManyProps = {
    readonly collection: ClientCollectionConfig;
};
export declare const EditMany: React.FC<EditManyProps>;
export declare const EditMany_v4: React.FC<{
    count: number;
    ids: (number | string)[];
    /**
     * When multiple EditMany components are rendered on the page, this will differentiate them.
     */
    modalPrefix?: string;
    onSuccess?: () => void;
    selectAll: boolean;
    where?: Where;
} & Omit<EditManyProps, 'ids'>>;
//# sourceMappingURL=index.d.ts.map