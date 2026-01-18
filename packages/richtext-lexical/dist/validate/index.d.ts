import type { SerializedEditorState } from 'lexical';
import type { RichTextField, Validate } from 'payload';
import type { SanitizedServerEditorConfig } from '../lexical/config/types.js';
export declare const richTextValidateHOC: ({ editorConfig, }: {
    editorConfig: SanitizedServerEditorConfig;
}) => Validate<SerializedEditorState<import("lexical").SerializedLexicalNode>, unknown, unknown, RichTextField>;
//# sourceMappingURL=index.d.ts.map