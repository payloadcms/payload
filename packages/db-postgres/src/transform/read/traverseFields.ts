/* eslint-disable no-param-reassign */
import type { SanitizedConfig } from 'payload/config';
import type { Field } from 'payload/types';

import { fieldAffectsData } from 'payload/types';

import type { BlocksMap } from '../../utilities/createBlocksMap.js';

import { transform } from './index.js';
import { mergeLocales } from './mergeLocales.js';

type TraverseFieldsArgs = {
  /**
   * Pre-formatted blocks map
   */
  blocks: BlocksMap
  /**
   * The full Payload config
   */
  config: SanitizedConfig
  /**
   * The full data, as returned from the Drizzle query
   */
  data: Record<string, unknown>
  /**
   * The locale to fall back to, if no locale present
   */
  fallbackLocale?: string
  /**
   * An array of Payload fields to traverse
   */
  fields: Field[]
  /**
   * The locale to retrieve
   */
  locale?: string
  /**
   * The current field path (in dot notation), used to merge in relationships
   */
  path: string
  /**
   * All related documents, as returned by Drizzle, keyed on an object by field path
   */
  relationships: Record<string, Record<string, unknown>[]>
  /**
   * Sibling data of the fields to traverse
   */
  siblingData: Record<string, unknown>
  /**
   * Data structure representing the nearest table from db
   */
  table: Record<string, unknown>
}

// Traverse fields recursively, transforming data
// for each field type into required Payload shape
export const traverseFields = <T extends Record<string, unknown>>({
  blocks,
  config,
  data,
  fallbackLocale,
  fields,
  locale,
  path,
  relationships,
  siblingData,
  table,
}: TraverseFieldsArgs): T => {
  const sanitizedPath = path ? `${path}.` : path;

  const formatted = fields.reduce((result, field) => {
    if (fieldAffectsData(field)) {
      const fieldData = result[field.name];

      switch (field.type) {
        case 'array':
          if (Array.isArray(fieldData)) {
            result[field.name] = fieldData.map((row, i) => {
              const dataWithLocales = mergeLocales({ data: row, fallbackLocale, locale });

              return traverseFields<T>({
                blocks,
                config,
                data,
                fields: field.fields,
                locale,
                path: `${sanitizedPath}${field.name}.${i}`,
                relationships,
                siblingData: dataWithLocales,
                table: dataWithLocales,
              });
            });
          }

          break;

        case 'blocks': {
          const blockFieldPath = `${sanitizedPath}${field.name}`;

          if (Array.isArray(blocks[blockFieldPath])) {
            result[field.name] = blocks[blockFieldPath].map((row, i) => {
              delete row._order;
              const dataWithLocales = mergeLocales({ data: row, fallbackLocale, locale });
              const block = field.blocks.find(({ slug }) => slug === row.blockType);

              if (block) {
                return traverseFields<T>({
                  blocks,
                  config,
                  data,
                  fields: block.fields,
                  locale,
                  path: `${blockFieldPath}.${i}`,
                  relationships,
                  siblingData: dataWithLocales,
                  table: dataWithLocales,
                });
              }

              return {};
            });
          }

          break;
        }

        case 'group': {
          const groupData: Record<string, unknown> = {
            ...(typeof fieldData === 'object' ? fieldData : {}),
          };

          field.fields.forEach((subField) => {
            if (fieldAffectsData(subField)) {
              const subFieldKey = `${sanitizedPath.replace(/\./g, '_')}${field.name}_${subField.name}`;
              if (table[subFieldKey]) {
                groupData[subField.name] = table[subFieldKey];
                delete table[subFieldKey];
              }
            }
          });

          result[field.name] = traverseFields<Record<string, unknown>>({
            blocks,
            config,
            data,
            fields: field.fields,
            locale,
            path: `${sanitizedPath}${field.name}`,
            relationships,
            siblingData: groupData,
            table,
          });

          break;
        }

        case 'relationship': {
          const relationPathMatch = relationships[`${sanitizedPath}${field.name}`];
          if (!relationPathMatch) break;

          if (!field.hasMany) {
            const relation = relationPathMatch[0];

            if (relation) {
              // Handle hasOne Poly
              if (Array.isArray(field.relationTo)) {
                const matchedRelation = Object.entries(relation).find(([key, val]) => val !== null && !['id', 'order', 'parent'].includes(key));

                if (matchedRelation) {
                  const relationTo = matchedRelation[0].replace('ID', '');

                  if (typeof matchedRelation[1] === 'object') {
                    const relatedCollection = config.collections.find(({ slug }) => slug === relationTo);

                    if (relatedCollection) {
                      const value = transform({
                        config,
                        data: matchedRelation[1] as Record<string, unknown>,
                        fallbackLocale,
                        fields: relatedCollection.fields,
                        locale,
                      });

                      result[field.name] = {
                        relationTo,
                        value,
                      };
                    }
                  } else {
                    result[field.name] = {
                      relationTo,
                      value: matchedRelation[1],
                    };
                  }
                }
              } else {
                // Handle hasOne
                const relatedData = relation[`${field.relationTo}ID`];

                if (typeof relatedData === 'object' && relatedData !== null) {
                  const relatedCollection = config.collections.find(({ slug }) => slug === field.relationTo);
                  result[field.name] = transform({
                    config,
                    data: relatedData as Record<string, unknown>,
                    fallbackLocale,
                    fields: relatedCollection.fields,
                    locale,
                  });
                } else {
                  result[field.name] = relatedData;
                }
              }
            }
          } else {
            const transformedRelations = [
              ...(Array.isArray(fieldData) ? fieldData : []),
            ];

            relationPathMatch.forEach((relation) => {
              // Handle hasMany
              if (!Array.isArray(field.relationTo)) {
                const relatedCollection = config.collections.find(({ slug }) => slug === field.relationTo);
                const relatedData = relation[`${field.relationTo}ID`];

                if (relatedData) {
                  if (typeof relatedData === 'object' && relatedData !== null) {
                    transformedRelations.push(transform({
                      config,
                      data: relatedData as Record<string, unknown>,
                      fallbackLocale,
                      fields: relatedCollection.fields,
                      locale,
                    }));
                  } else {
                    transformedRelations.push(relatedData);
                  }
                }
              } else {
                // Handle hasMany Poly
                const matchedRelation = Object.entries(relation).find(([key, val]) => val !== null && !['id', 'order', 'parent'].includes(key));

                if (matchedRelation) {
                  const relationTo = matchedRelation[0].replace('ID', '');

                  if (typeof matchedRelation[1] === 'object') {
                    const relatedCollection = config.collections.find(({ slug }) => slug === relationTo);

                    if (relatedCollection) {
                      const value = transform({
                        config,
                        data: matchedRelation[1] as Record<string, unknown>,
                        fallbackLocale,
                        fields: relatedCollection.fields,
                        locale,
                      });

                      transformedRelations.push({
                        relationTo,
                        value,
                      });
                    }
                  } else {
                    transformedRelations.push({
                      relationTo,
                      value: matchedRelation[1],
                    });
                  }
                }
              }
            });

            result[field.name] = transformedRelations;
          }

          break;
        }

        case 'date': {
          if (fieldData instanceof Date) {
            result[field.name] = fieldData.toISOString();
          }

          break;
        }

        default: {
          break;
        }
      }

      return result;
    }

    return siblingData;
  }, siblingData);

  return formatted as T;
};
