/* eslint-disable no-param-reassign */
import { Field } from 'payload/types';
import { TypeWithID } from 'payload/dist/collections/config/types';
import { SanitizedConfig } from 'payload/config';
import { traverseFields } from './traverseFields';
import { createRelationshipMap } from '../../utilities/createRelationshipMap';
import { createBlocksMap } from '../../utilities/createBlocksMap';

type TransformArgs = {
  config: SanitizedConfig
  data: Record<string, unknown>
  fallbackLocale?: false | string
  fields: Field[]
  locale?: string
}

// This is the entry point to transform Drizzle output data
// into the shape Payload expects based on field schema
export const transform = <T extends TypeWithID>({
  config,
  data,
  fields,
}: TransformArgs): T => {
  let relationships: Record<string, Record<string, unknown>[]> = {}

  if ('_relationships' in data) {
    relationships = createRelationshipMap(data._relationships)
    delete data._relationships
  }

  const blocks = createBlocksMap(data)

  const result = traverseFields<T>({
    blocks,
    config,
    data,
    fields,
    path: '',
    relationships,
    siblingData: data,
    table: data,
  });

  if ('_locales' in result) {
    delete result._locales;
  }

  return result;
};
