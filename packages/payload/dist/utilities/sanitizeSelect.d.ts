import type { FlattenedField } from '../fields/config/types.js';
import type { SelectType } from '../types/index.js';
export declare const sanitizeSelect: ({ fields, forceSelect, select, versions, }: {
    fields: FlattenedField[];
    forceSelect?: SelectType;
    select?: SelectType;
    versions?: boolean;
}) => SelectType | undefined;
//# sourceMappingURL=sanitizeSelect.d.ts.map