import type { EditorState, LexicalEditor, SerializedEditorState } from 'lexical';
import * as React from 'react';
import type { LexicalRichTextFieldProps } from '../types.js';
import type { SanitizedClientEditorConfig } from './config/types.js';
export type LexicalProviderProps = {
    composerKey: string;
    editorConfig: SanitizedClientEditorConfig;
    fieldProps: LexicalRichTextFieldProps;
    isSmallWidthViewport: boolean;
    onChange: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void;
    readOnly: boolean;
    value: SerializedEditorState;
};
export declare const LexicalProvider: React.FC<LexicalProviderProps>;
//# sourceMappingURL=LexicalProvider.d.ts.map