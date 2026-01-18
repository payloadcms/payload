import React from 'react';
import type { SanitizedClientEditorConfig } from '../lexical/config/types.js';
import '../lexical/theme/EditorTheme.scss';
import './bundled.css';
import './index.scss';
import type { LexicalRichTextFieldProps } from '../types.js';
declare const RichTextComponent: React.FC<{
    readonly editorConfig: SanitizedClientEditorConfig;
} & LexicalRichTextFieldProps>;
export declare const RichText: typeof RichTextComponent;
export {};
//# sourceMappingURL=Field.d.ts.map