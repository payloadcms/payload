import type { ClientConfig } from 'payload';
import React from 'react';
import './index.scss';
export type LocaleOption = {
    label: string;
    value: string;
};
export type SelectLocalesDrawerProps = {
    readonly localization: Exclude<ClientConfig['localization'], false>;
    readonly onConfirm: (args: {
        selectedLocales: string[];
    }) => Promise<void> | void;
    readonly slug: string;
};
export declare const SelectLocalesDrawer: React.FC<SelectLocalesDrawerProps>;
//# sourceMappingURL=index.d.ts.map