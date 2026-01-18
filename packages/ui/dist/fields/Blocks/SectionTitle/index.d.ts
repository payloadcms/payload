import React from 'react';
import './index.scss';
export type Props = {
    customOnChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    customValue?: string;
    path: string;
    readOnly: boolean;
};
/**
 * An input field representing the block's `blockName` property - responsible for reading and saving the `blockName`
 * property from/into the provided path.
 */
export declare const SectionTitle: React.FC<Props>;
//# sourceMappingURL=index.d.ts.map