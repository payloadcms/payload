import type { FormState } from 'payload';
import './index.scss';
import React from 'react';
import type { InlineBlockFields } from '../../server/nodes/InlineBlocksNode.js';
type Props = {
    /**
     * Can be modified by the node in order to trigger the re-fetch of the initial state based on the
     * formData. This is useful when node.setFields() is explicitly called from outside of the form - in
     * this case, the new field state is likely not reflected in the form state, so we need to re-fetch
     */
    readonly cacheBuster: number;
    readonly className: string;
    readonly formData: InlineBlockFields;
    readonly nodeKey: string;
};
type InlineBlockComponentContextType = {
    EditButton?: React.FC;
    initialState: false | FormState | undefined;
    InlineBlockContainer?: React.FC<{
        children: React.ReactNode;
    }>;
    Label?: React.FC;
    nodeKey?: string;
    RemoveButton?: React.FC;
};
export declare const useInlineBlockComponentContext: () => InlineBlockComponentContextType;
export declare const InlineBlockComponent: React.FC<Props>;
export {};
//# sourceMappingURL=index.d.ts.map