import { FilterOptions } from '../../../../fields/config/types';
import { FilterOptionsResult } from '../../forms/field-types/Relationship/types';
type Args = {
    filterOptions: FilterOptions;
    filterOptionsResult: FilterOptionsResult;
    setFilterOptionsResult: (optionFilters: FilterOptionsResult) => void;
    relationTo: string | string[];
    path: string;
};
export declare const GetFilterOptions: ({ filterOptions, filterOptionsResult, setFilterOptionsResult, relationTo, path, }: Args) => null;
export {};
