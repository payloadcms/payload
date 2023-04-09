import { Option } from '../../../elements/ReactSelect/types';
import { OptionGroup, Value } from './types';
type Args = {
    value: Value | Value[];
    options: OptionGroup[];
};
export declare const findOptionsByValue: ({ value, options }: Args) => Option | Option[];
export {};
