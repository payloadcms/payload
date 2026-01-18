import type { LexicalPluginNodeConverter } from './converter/types.js';
export type LexicalPluginToLexicalFeatureProps = {
    converters?: (({ defaultConverters, }: {
        defaultConverters: LexicalPluginNodeConverter[];
    }) => LexicalPluginNodeConverter[]) | LexicalPluginNodeConverter[];
    disableHooks?: boolean;
    quiet?: boolean;
};
export declare const LexicalPluginToLexicalFeature: import("../../typesServer.js").FeatureProviderProviderServer<LexicalPluginToLexicalFeatureProps, LexicalPluginToLexicalFeatureProps, undefined>;
//# sourceMappingURL=feature.server.d.ts.map