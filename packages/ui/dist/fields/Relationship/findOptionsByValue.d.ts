import type { ValueWithRelation } from 'payload';
import type { Option } from '../../elements/ReactSelect/types.js';
import type { OptionGroup } from './types.js';
type Args = {
    allowEdit: boolean;
    options: OptionGroup[];
    value: ValueWithRelation | ValueWithRelation[];
};
export declare const findOptionsByValue: ({ allowEdit, options, value }: Args) => Option | Option[];
export {};
//# sourceMappingURL=findOptionsByValue.d.ts.map