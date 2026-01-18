import type { ClientCollectionConfig, ClientConfig, ViewTypes } from 'payload';
import React from 'react';
import './index.scss';
type DefaultListViewTabsProps = {
    collectionConfig: ClientCollectionConfig;
    config: ClientConfig;
    onChange?: (viewType: ViewTypes) => void;
    viewType?: ViewTypes;
};
export declare const DefaultListViewTabs: React.FC<DefaultListViewTabsProps>;
export {};
//# sourceMappingURL=index.d.ts.map