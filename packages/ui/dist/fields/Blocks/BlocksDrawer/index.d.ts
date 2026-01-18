import type { ClientBlock, Labels } from 'payload';
import React from 'react';
export type Props = {
    readonly addRow: (index: number, blockType?: string) => Promise<void> | void;
    readonly addRowIndex: number;
    readonly blocks: (ClientBlock | string)[];
    readonly drawerSlug: string;
    readonly labels: Labels;
};
export declare const BlocksDrawer: React.FC<Props>;
//# sourceMappingURL=index.d.ts.map