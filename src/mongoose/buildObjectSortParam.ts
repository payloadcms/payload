import { Config } from '../config/types';
import { getLocalizedSortProperty } from './getLocalizedSortProperty';
import { Field } from '../fields/config/types';

type SortObject = { [key: string]: 1 | -1 | 'asc' | 'desc' };

type Args = {
  sort: SortObject
  config: Config
  fields: Field[]
  locale: string
}

export const buildObjectSortParam = ({ sort: incomingSort, config, fields, locale }: Args): SortObject => {
  return Object.entries(incomingSort).reduce<SortObject>((acc, [property, order]) => {
    if (property === 'id') {
      acc._id = order;
      return acc;
    }
    const localizedProperty = getLocalizedSortProperty({
      segments: property.split('.'),
      config,
      fields,
      locale,
    });
    acc[localizedProperty] = order;
    return acc;
  }, {});
};
