import type { Field, SanitizedConfig } from 'payload';
/**
 * Recursively applies baseFilter from collection config to relationship fields
 * within blocks. This ensures that relationship drawers in blocks respect
 * collection-level filters like multi-tenant filtering.
 *
 * Based on the fix from PR #13229 for LinkFeature
 */
export declare function applyBaseFilterToFields(fields: Field[], config: SanitizedConfig): Field[];
//# sourceMappingURL=applyBaseFilterToFields.d.ts.map