import type { SerializedEditorState } from 'lexical';
import React from 'react';
import type { DefaultNodeTypes, SerializedBlockNode, SerializedInlineBlockNode } from '../../../../nodeTypes.js';
import type { JSXConverters } from '../converter/types.js';
export type JSXConvertersFunction<T extends {
    [key: string]: any;
    type?: string;
} = DefaultNodeTypes | SerializedBlockNode<{
    blockName?: null | string;
}> | SerializedInlineBlockNode<{
    blockName?: null | string;
}>> = (args: {
    defaultConverters: JSXConverters<DefaultNodeTypes>;
}) => JSXConverters<T>;
type RichTextProps = {
    /**
     * Override class names for the container.
     */
    className?: string;
    /**
     * Custom converters to transform your nodes to JSX. Can be an object or a function that receives the default converters.
     */
    converters?: JSXConverters | JSXConvertersFunction;
    /**
     * Serialized editor state to render.
     */
    data: SerializedEditorState;
    /**
     * If true, removes the container div wrapper.
     */
    disableContainer?: boolean;
    /**
     * If true, disables indentation globally. If an array, disables for specific node `type` values.
     */
    disableIndent?: boolean | string[];
    /**
     * If true, disables text alignment globally. If an array, disables for specific node `type` values.
     */
    disableTextAlign?: boolean | string[];
};
export declare const RichText: React.FC<RichTextProps>;
export {};
//# sourceMappingURL=index.d.ts.map