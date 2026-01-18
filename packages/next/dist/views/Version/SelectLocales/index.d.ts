import { type SelectablePill } from '@payloadcms/ui';
import React from 'react';
export type SelectedLocaleOnChange = (args: {
    locales: SelectablePill[];
}) => void;
export type Props = {
    locales: SelectablePill[];
    localeSelectorOpen: boolean;
    onChange: SelectedLocaleOnChange;
};
export declare const SelectLocales: React.FC<Props>;
//# sourceMappingURL=index.d.ts.map