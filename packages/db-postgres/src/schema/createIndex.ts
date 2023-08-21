/* eslint-disable no-param-reassign */
import { uniqueIndex, index } from 'drizzle-orm/pg-core';
import { GenericColumn } from '../types';

type CreateIndexArgs = {
  name: string
  columnName: string
  unique?: boolean
}

export const createIndex = ({ name, columnName, unique }: CreateIndexArgs) => {
  return (table: { [x: string]: GenericColumn }) => {
    if (unique) return uniqueIndex(`${columnName}_idx`).on(table[name]);
    return index(`${columnName}_idx`).on(table[name]);
  };
};
