import type { Field } from 'payload';
/**
 * Recursively traverses a Payload field schema to collect all field paths
 * that are explicitly disabled for the import/export plugin via:
 *   field.custom['plugin-import-export'].disabled
 *
 * Handles nested fields including named tabs, groups, arrays, blocks, etc.
 * Tracks each field’s path by storing it in `ref.path` and manually propagating
 * it through named tab layers via a temporary `__manualRef` marker.
 *
 * @param fields - The top-level array of Payload field definitions
 * @returns An array of dot-notated field paths that are marked as disabled
 */
export declare const collectDisabledFieldPaths: (fields: Field[]) => string[];
//# sourceMappingURL=collectDisabledFieldPaths.d.ts.map