import type { BaseEditor } from 'slate';
import type { HistoryEditor } from 'slate-history';
import type { ReactEditor } from 'slate-react';
import React from 'react';
import type { ElementNode, TextNode } from '../types.js';
import type { LoadedSlateFieldProps } from './types.js';
import './index.scss';
declare module 'slate' {
    interface CustomTypes {
        Editor: BaseEditor & HistoryEditor & ReactEditor;
        Element: ElementNode;
        Text: TextNode;
    }
}
export declare const RichText: React.FC<LoadedSlateFieldProps>;
//# sourceMappingURL=RichText.d.ts.map