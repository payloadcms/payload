import type { SanitizedConfig } from '../config/types.js';
import type { FlattenedField } from '../fields/config/types.js';
/**
 * Get the field by its schema path, e.g. group.title, array.group.title
 * If there were any localized on the path, `pathHasLocalized` will be true and `localizedPath` will look like:
 * `group.<locale>.title` // group is localized here
 */
export declare const getFieldByPath: ({ config, fields, includeRelationships, localizedPath, path, }: {
    config?: SanitizedConfig;
    fields: FlattenedField[];
    includeRelationships?: boolean;
    localizedPath?: string;
    /**
     * The schema path, e.g. `array.group.title`
     */
    path: string;
}) => {
    field: FlattenedField;
    localizedPath: string;
    pathHasLocalized: boolean;
} | null;
//# sourceMappingURL=getFieldByPath.d.ts.map