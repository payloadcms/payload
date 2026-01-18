type SerializedLexicalEditor = {
    root: {
        children: Array<{
            children?: Array<{
                type: string;
            }>;
            type: string;
        }>;
    };
};
export declare function isSerializedLexicalEditor(value: unknown): value is SerializedLexicalEditor;
export declare function formatLexicalDocTitle(editorState: Array<{
    children?: Array<{
        type: string;
    }>;
    type: string;
}>, textContent: string): string;
export {};
//# sourceMappingURL=formatLexicalDocTitle.d.ts.map