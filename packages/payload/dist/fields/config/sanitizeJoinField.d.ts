import type { SanitizedJoin, SanitizedJoins } from '../../collections/config/types.js';
import type { Config } from '../../config/types.js';
import type { FlattenedJoinField, JoinField } from './types.js';
export declare const sanitizeJoinField: ({ config, field, joinPath, joins, parentIsLocalized, polymorphicJoins, validateOnly, }: {
    config: Config;
    field: FlattenedJoinField | JoinField;
    joinPath?: string;
    joins?: SanitizedJoins;
    parentIsLocalized: boolean;
    polymorphicJoins?: SanitizedJoin[];
    validateOnly?: boolean;
}) => void;
//# sourceMappingURL=sanitizeJoinField.d.ts.map