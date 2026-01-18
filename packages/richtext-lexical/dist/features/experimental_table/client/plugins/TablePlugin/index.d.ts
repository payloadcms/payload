import type { EditorThemeClasses, Klass, LexicalCommand, LexicalEditor, LexicalNode } from 'lexical';
import type { JSX } from 'react';
import * as React from 'react';
import type { PluginComponent } from '../../../../typesClient.js';
import './index.scss';
export type CellContextShape = {
    cellEditorConfig: CellEditorConfig | null;
    cellEditorPlugins: Array<JSX.Element> | JSX.Element | null;
    set: (cellEditorConfig: CellEditorConfig | null, cellEditorPlugins: Array<JSX.Element> | JSX.Element | null) => void;
};
export type CellEditorConfig = Readonly<{
    namespace: string;
    nodes?: ReadonlyArray<Klass<LexicalNode>>;
    onError: (error: Error, editor: LexicalEditor) => void;
    readOnly?: boolean;
    theme?: EditorThemeClasses;
}>;
export declare const OPEN_TABLE_DRAWER_COMMAND: LexicalCommand<{}>;
export declare const CellContext: React.Context<CellContextShape>;
export declare function TableContext({ children }: {
    children: JSX.Element;
}): JSX.Element;
export declare const TablePlugin: PluginComponent;
//# sourceMappingURL=index.d.ts.map