import { Where } from '../../../../types';
import { FilterOptions, FilterOptionsProps } from '../../../../fields/config/types';
export declare const getFilterOptionsQuery: (filterOptions: FilterOptions, options: Omit<FilterOptionsProps, 'relationTo'> & {
    relationTo: string | string[];
}) => {
    [collection: string]: Where;
};
