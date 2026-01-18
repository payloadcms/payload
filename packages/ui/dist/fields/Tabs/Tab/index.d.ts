import type { ClientTab } from 'payload';
import React from 'react';
import './index.scss';
type TabProps = {
    readonly hidden?: boolean;
    readonly isActive?: boolean;
    readonly parentPath: string;
    readonly setIsActive: () => void;
    readonly tab: ClientTab;
};
export declare const TabComponent: React.FC<TabProps>;
export {};
//# sourceMappingURL=index.d.ts.map