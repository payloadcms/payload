import type { SerializedLexicalNode } from 'lexical';
import type { SanitizedServerEditorConfig } from '../../../lexical/config/types.js';
import type { DefaultNodeTypes, TypedEditorState } from '../../../nodeTypes.js';
export declare const convertMarkdownToLexical: <TNodeTypes extends SerializedLexicalNode = DefaultNodeTypes>({ editorConfig, markdown, }: {
    editorConfig: SanitizedServerEditorConfig;
    markdown: string;
}) => TypedEditorState<TNodeTypes>;
//# sourceMappingURL=index.d.ts.map