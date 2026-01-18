import type { FieldHook } from '../../config/types.js';
import type { SlugFieldArgs } from './index.js';
type HookArgs = {
    slugFieldName: NonNullable<SlugFieldArgs['name']>;
} & Pick<SlugFieldArgs, 'slugify'> & Required<Pick<SlugFieldArgs, 'useAsSlug'>>;
/**
 * This is a `BeforeChange` field hook used to auto-generate the `slug` field.
 * See `slugField` for more details.
 */
export declare const generateSlug: ({ slugFieldName, slugify: customSlugify, useAsSlug }: HookArgs) => FieldHook;
export {};
//# sourceMappingURL=generateSlug.d.ts.map