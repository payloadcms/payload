import { Config } from '../config/types';
import { getLocalizedSortProperty } from './getLocalizedSortProperty';
import { Field } from '../fields/config/types';

type Args = {
  sort: string
  config: Config
  fields: Field[]
  timestamps: boolean
  locale: string
}

export const buildSortParam = ({ sort, config, fields, timestamps, locale }: Args): [string, string] => {
  let sortProperty: string;
  let sortOrder = 'desc';

  if (!sort) {
    if (timestamps) {
      sortProperty = 'createdAt';
    } else {
      sortProperty = '_id';
    }
  } else if (sort.indexOf('-') === 0) {
    sortProperty = sort.substring(1);
  } else {
    sortProperty = sort;
    sortOrder = 'asc';
  }

  if (sortProperty === 'id') {
    sortProperty = '_id';
  } else {
    sortProperty = getLocalizedSortProperty({
      segments: sortProperty.split('.'),
      config,
      fields,
      locale,
    });
  }

  return [sortProperty, sortOrder];
};
