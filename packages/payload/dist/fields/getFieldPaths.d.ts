import type { ClientTab } from '../admin/types.js';
import type { ClientField, Field, Tab, TabAsFieldClient } from './config/types.js';
type Args = {
    field: ClientField | ClientTab | Field | Tab | TabAsFieldClient;
    index: number;
    parentIndexPath: string;
    /**
     * Needed to generate data paths. Omit if you only need schema paths, e.g. within field schema maps.
     */
    parentPath?: string;
    parentSchemaPath: string;
};
type FieldPaths = {
    /**
     * A string of '-' separated indexes representing where
     * to find this field in a given field schema array.
     * It will always be complete and accurate.
     */
    indexPath: string;
    /**
     * Path for this field relative to its position in the data.
     */
    path: string;
    /**
     * Path for this field relative to its position in the schema.
     */
    schemaPath: string;
};
export declare function getFieldPaths({ field, index, parentIndexPath, parentPath, parentSchemaPath, }: Args): FieldPaths;
export {};
//# sourceMappingURL=getFieldPaths.d.ts.map