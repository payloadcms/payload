import type { ClientField, Field } from 'payload';
/**
 * Filters fields that are hidden, disabled, or have `disableListColumn` set to `true`.
 * Recurses through `tabs` and any container with `.fields` (e.g., `row`, `group`, `collapsible`).
 */
export declare const filterFields: <T extends ClientField | Field>(incomingFields: T[]) => T[];
//# sourceMappingURL=filterFields.d.ts.map