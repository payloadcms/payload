/* eslint-disable no-param-reassign */
import { uniqueIndex, index } from 'drizzle-orm/pg-core';
import { GenericColumn } from '../types';

type CreateIndexArgs = {
  name: string
  formattedName: string
  unique?: boolean
}

export const createIndex = ({ name, formattedName, unique }: CreateIndexArgs) => {
  return (table: { [x: string]: GenericColumn }) => {
    if (unique) return uniqueIndex(`${formattedName}_idx`).on(table[name]);
    return index(`${formattedName}_idx`).on(table[name]);
  };
};
