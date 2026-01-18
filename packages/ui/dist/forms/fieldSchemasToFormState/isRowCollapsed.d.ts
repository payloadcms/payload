import type { ArrayField, BlocksField, CollapsedPreferences, Row } from 'payload';
export declare function isRowCollapsed({ collapsedPrefs, field, previousRow, row, }: {
    collapsedPrefs: CollapsedPreferences;
    field: ArrayField | BlocksField;
    previousRow: Row | undefined;
    row: Row;
}): boolean;
//# sourceMappingURL=isRowCollapsed.d.ts.map