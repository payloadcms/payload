import React from 'react';
import type { BlockFields } from '../../server/nodes/BlocksNode.js';
import './index.scss';
type Props = {
    /**
     * Can be modified by the node in order to trigger the re-fetch of the initial state based on the
     * formData. This is useful when node.setFields() is explicitly called from outside of the form - in
     * this case, the new field state is likely not reflected in the form state, so we need to re-fetch
     */
    readonly cacheBuster: number;
    readonly className: string;
    readonly formData: BlockFields;
    readonly nodeKey: string;
};
export declare const BlockComponent: React.FC<Props>;
export {};
//# sourceMappingURL=index.d.ts.map