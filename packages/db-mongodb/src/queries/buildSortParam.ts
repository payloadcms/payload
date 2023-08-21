import { PaginateOptions } from 'mongoose';
import { Config } from 'payload/dist/config/types';
import { Field } from 'payload/dist/fields/config/types';
import { getLocalizedSortProperty } from './getLocalizedSortProperty';

type Args = {
  sort: string
  config: Config
  fields: Field[]
  timestamps: boolean
  locale: string
}

export type SortArgs = {
  property: string
  direction: SortDirection
}[]

export type SortDirection = 'asc' | 'desc';

export const buildSortParam = ({ sort, config, fields, timestamps, locale }: Args): PaginateOptions['sort'] => {
  let sortProperty: string;
  let sortDirection: SortDirection = 'desc';

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
    sortDirection = 'asc';
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

  return { [sortProperty]: sortDirection };
};
