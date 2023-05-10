import { Where } from '../../../../types';
import { FilterOptions, FilterOptionsProps } from '../../../../fields/config/types';

export const getFilterOptionsQuery = (filterOptions: FilterOptions, options: Omit<FilterOptionsProps, 'relationTo'> & { relationTo: string | string[] }): {[collection: string]: Where } => {
  const { relationTo } = options;
  const relations = Array.isArray(relationTo) ? relationTo : [relationTo];
  const query = {};
  if (typeof filterOptions !== 'undefined') {
    relations.forEach((relation) => {
      query[relation] = typeof filterOptions === 'function' ? filterOptions({ ...options, relationTo: relation }) : filterOptions;
    });
  }
  return query;
};
