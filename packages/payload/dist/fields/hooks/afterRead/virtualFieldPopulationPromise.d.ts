import type { TypedFallbackLocale } from '../../../index.js';
import type { PayloadRequest } from '../../../types/index.js';
import type { FlattenedField } from '../../config/types.js';
export declare const virtualFieldPopulationPromise: ({ name, draft, fallbackLocale, fields, hasMany, locale, overrideAccess, ref, req, segments, showHiddenFields, siblingDoc, }: {
    draft: boolean;
    fallbackLocale: TypedFallbackLocale;
    fields: FlattenedField[];
    hasMany?: boolean;
    locale: string;
    name: string;
    overrideAccess: boolean;
    ref: any;
    req: PayloadRequest;
    segments: string[];
    shift?: boolean;
    showHiddenFields: boolean;
    siblingDoc: Record<string, unknown>;
}) => Promise<void>;
//# sourceMappingURL=virtualFieldPopulationPromise.d.ts.map