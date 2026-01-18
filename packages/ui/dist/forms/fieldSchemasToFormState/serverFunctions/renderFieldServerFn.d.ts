import { type Field, type FieldState, type ServerFunction } from 'payload';
export type RenderFieldServerFnArgs<TField = Field> = {
    /**
     * Override field config pulled from schemaPath lookup
     */
    field?: Partial<TField>;
    /**
     * Pass the value this field will receive when rendering it on the server.
     * For richText, this helps provide initial state for sub-fields that are immediately rendered (like blocks)
     * so that we can avoid multiple waterfall requests for each block that renders on the client.
     */
    initialValue?: unknown;
    /**
     * Path to the field to render
     * @default field name
     */
    path?: string;
    /**
     * Dot schema path to a richText field declared in your config.
     * Format:
     *   "collection.<collectionSlug>.<fieldPath>"
     *   "global.<globalSlug>.<fieldPath>"
     *
     * Examples:
     *   "collection.posts.richText"
     *   "global.siteSettings.content"
     */
    schemaPath: string;
};
export type RenderFieldServerFnReturnType = {} & FieldState['customComponents'];
/**
 * @experimental - may break in minor releases
 */
export declare const _internal_renderFieldHandler: ServerFunction<RenderFieldServerFnArgs, Promise<RenderFieldServerFnReturnType>>;
//# sourceMappingURL=renderFieldServerFn.d.ts.map