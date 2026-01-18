import type { FlattenedField } from '../fields/config/types.js';
import type { Payload, Where } from '../types/index.js';
/**
 * Currently used only for virtual fields linked with relationships
 */
export declare const sanitizeWhereQuery: ({ fields, payload, where, }: {
    fields: FlattenedField[];
    payload: Payload;
    where: Where;
}) => void;
//# sourceMappingURL=sanitizeWhereQuery.d.ts.map