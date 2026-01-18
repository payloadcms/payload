export type IndentFeatureProps = {
    /**
     * The nodes that should not be indented. "type" property of the nodes you don't want to be indented.
     * These can be: "paragraph", "heading", "listitem", "quote" or other indentable nodes if they exist.
     */
    disabledNodes?: string[];
    /**
     * If true, pressing Tab in the middle of a block such as a paragraph or heading will not insert a tabNode.
     * Instead, Tab will only be used for block-level indentation.
     *
     * @default false
     */
    disableTabNode?: boolean;
};
export declare const IndentFeature: import("../../typesServer.js").FeatureProviderProviderServer<IndentFeatureProps, IndentFeatureProps, IndentFeatureProps>;
//# sourceMappingURL=index.d.ts.map