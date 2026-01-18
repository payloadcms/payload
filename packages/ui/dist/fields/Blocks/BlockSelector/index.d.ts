import type { ClientBlock } from 'payload';
import React from 'react';
import './index.scss';
export type Props = {
    readonly blocks: (ClientBlock | string)[];
    readonly onSelect?: (blockType: string) => void;
    /**
     * Control the search term state externally
     */
    searchTerm?: string;
};
export declare const BlockSelector: React.FC<Props>;
//# sourceMappingURL=index.d.ts.map