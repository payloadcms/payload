import type { PathToQuery } from './queryValidation/types.js';
import { type FlattenedField } from '../fields/config/types.js';
import { type Payload } from '../index.js';
export declare function getLocalizedPaths({ collectionSlug, fields, globalSlug, incomingPath, locale, overrideAccess, parentIsLocalized, payload, }: {
    collectionSlug?: string;
    fields: FlattenedField[];
    globalSlug?: string;
    incomingPath: string;
    locale?: string;
    overrideAccess?: boolean;
    /**
     * @todo make required in v4.0. Usually, you'd wanna pass this through
     */
    parentIsLocalized?: boolean;
    payload: Payload;
}): PathToQuery[];
//# sourceMappingURL=getLocalizedPaths.d.ts.map