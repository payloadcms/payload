import type { ClientComponentProps, FieldPaths, ServerComponentProps } from 'payload';
import React from 'react';
import type { SanitizedServerEditorConfig } from '../lexical/config/types.js';
import type { LexicalEditorProps } from '../types.js';
export declare const RscEntryLexicalField: React.FC<{
    sanitizedEditorConfig: SanitizedServerEditorConfig;
} & ClientComponentProps & Pick<FieldPaths, 'path'> & Pick<LexicalEditorProps, 'admin'> & ServerComponentProps>;
//# sourceMappingURL=rscEntry.d.ts.map