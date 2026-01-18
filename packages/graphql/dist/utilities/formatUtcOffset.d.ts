/**
 * Converts a UTC offset string to a GraphQL-safe enum name.
 * Uses `_TZOFFSET_` prefix to avoid conflicts with user-defined enum values.
 *
 * Examples:
 * - '+05:30' → '_TZOFFSET_PLUS_05_30'
 * - '-08:00' → '_TZOFFSET_MINUS_08_00'
 * - '+00:00' → '_TZOFFSET_PLUS_00_00'
 *
 * @returns The GraphQL-safe name, or null if not a UTC offset
 */
export declare const formatUtcOffset: (value: string) => null | string;
//# sourceMappingURL=formatUtcOffset.d.ts.map