import type { HTMLConverter } from './converter/types.js';
export type HTMLConverterFeatureProps = {
    converters?: (({ defaultConverters }: {
        defaultConverters: HTMLConverter<any>[];
    }) => HTMLConverter<any>[]) | HTMLConverter<any>[];
};
/**
 * @deprecated - will be removed in 4.0. Please refer to https://payloadcms.com/docs/rich-text/converting-html
 * to see all the ways to convert lexical to HTML.
 */
export declare const HTMLConverterFeature: import("../../typesServer.js").FeatureProviderProviderServer<HTMLConverterFeatureProps, HTMLConverterFeatureProps, undefined>;
//# sourceMappingURL=index.d.ts.map