import { type SerializedLexicalNode } from 'lexical';
import type { SanitizedServerEditorConfig } from '../../../lexical/config/types.js';
import type { DefaultNodeTypes, TypedEditorState } from '../../../nodeTypes.js';
export declare const convertHTMLToLexical: <TNodeTypes extends SerializedLexicalNode = DefaultNodeTypes>({ editorConfig, html, JSDOM, }: {
    editorConfig: SanitizedServerEditorConfig;
    html: string;
    JSDOM: new (html: string) => {
        window: {
            document: Document;
        };
    };
}) => TypedEditorState<TNodeTypes>;
//# sourceMappingURL=index.d.ts.map