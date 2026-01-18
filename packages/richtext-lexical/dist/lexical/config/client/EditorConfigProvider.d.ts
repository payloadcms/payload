import type { LexicalEditor } from 'lexical';
import type { MarkRequired } from 'ts-essentials';
import * as React from 'react';
import type { InlineBlockNode } from '../../../features/blocks/client/nodes/InlineBlocksNode.js';
import type { LexicalRichTextFieldProps } from '../../../types.js';
import type { SanitizedClientEditorConfig } from '../types.js';
export interface EditorConfigContextType {
    blurEditor: (editorContext: EditorConfigContextType) => void;
    childrenEditors: React.RefObject<Map<string, EditorConfigContextType>>;
    createdInlineBlock?: InlineBlockNode;
    editDepth: number;
    editor: LexicalEditor;
    editorConfig: SanitizedClientEditorConfig;
    editorContainerRef: React.RefObject<HTMLDivElement>;
    fieldProps: MarkRequired<LexicalRichTextFieldProps, 'path' | 'schemaPath'>;
    focusedEditor: EditorConfigContextType | null;
    focusEditor: (editorContext: EditorConfigContextType) => void;
    parentEditor: EditorConfigContextType;
    registerChild: (uuid: string, editorContext: EditorConfigContextType) => void;
    setCreatedInlineBlock?: React.Dispatch<React.SetStateAction<InlineBlockNode | undefined>>;
    unregisterChild?: (uuid: string) => void;
    uuid: string;
}
export declare const EditorConfigProvider: ({ children, editorConfig, editorContainerRef, fieldProps, parentContext, }: {
    children: React.ReactNode;
    editorConfig: SanitizedClientEditorConfig;
    editorContainerRef: React.RefObject<HTMLDivElement | null>;
    fieldProps: LexicalRichTextFieldProps;
    parentContext?: EditorConfigContextType;
}) => React.ReactNode;
export declare const useEditorConfigContext: () => EditorConfigContextType;
//# sourceMappingURL=EditorConfigProvider.d.ts.map