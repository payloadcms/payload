import type { Operator, Option, ResolvedFilterOptions } from 'payload';
import React from 'react';
import type { ReducedField, Value } from '../../types.js';
type Props = {
    booleanSelect: boolean;
    disabled: boolean;
    filterOptions: ResolvedFilterOptions;
    internalField: ReducedField;
    onChange: React.Dispatch<React.SetStateAction<string>>;
    operator: Operator;
    options: Option[];
    value: Value;
};
export declare const DefaultFilter: React.FC<Props>;
export {};
//# sourceMappingURL=index.d.ts.map