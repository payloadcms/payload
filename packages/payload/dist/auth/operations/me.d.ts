import type { Collection } from '../../collections/config/types.js';
import type { JoinQuery, PayloadRequest, PopulateType, SelectType } from '../../types/index.js';
import type { ClientUser } from '../types.js';
export type MeOperationResult = {
    collection?: string;
    exp?: number;
    /** @deprecated
     * use:
     * ```ts
     * user._strategy
     * ```
     */
    strategy?: string;
    token?: string;
    user?: ClientUser;
};
export type Arguments = {
    collection: Collection;
    currentToken?: string;
    depth?: number;
    draft?: boolean;
    joins?: JoinQuery;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
};
export declare const meOperation: (args: Arguments) => Promise<MeOperationResult>;
//# sourceMappingURL=me.d.ts.map