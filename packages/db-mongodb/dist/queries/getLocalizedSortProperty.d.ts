import type { FlattenedField, SanitizedConfig } from 'payload';
type Args = {
    config: SanitizedConfig;
    fields: FlattenedField[];
    locale?: string;
    parentIsLocalized: boolean;
    result?: string;
    segments: string[];
};
export declare const getLocalizedSortProperty: ({ config, fields, locale, parentIsLocalized, result: incomingResult, segments: incomingSegments, }: Args) => string;
export {};
//# sourceMappingURL=getLocalizedSortProperty.d.ts.map