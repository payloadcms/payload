import React from 'react';
import './index.scss';
export type PerPageProps = {
    readonly defaultLimit?: number;
    readonly handleChange?: (limit: number) => void;
    readonly limit: number;
    readonly limits: number[];
    readonly resetPage?: boolean;
};
export declare const PerPage: React.FC<PerPageProps>;
//# sourceMappingURL=index.d.ts.map