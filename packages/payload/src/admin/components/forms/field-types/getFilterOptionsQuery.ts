import { Where } from '../../../../types';
import { FilterOptions, FilterOptionsProps } from '../../../../fields/config/types';

export const getFilterOptionsQuery = async (filterOptions: FilterOptions, options: Omit<FilterOptionsProps, 'relationTo'> & { relationTo: string | string[] }): Promise<{[collection: string]: Where }> => {
  const { relationTo } = options;
  const relations = Array.isArray(relationTo) ? relationTo : [relationTo];
  const query = {};
  if (typeof filterOptions !== 'undefined') {
    await Promise.all(relations.map(async (relation) => {
      query[relation] = typeof filterOptions === 'function' ? await filterOptions({ ...options, relationTo: relation }) : filterOptions;
    }));
  }
  return query;
};
