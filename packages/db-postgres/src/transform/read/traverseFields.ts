/* eslint-disable no-param-reassign */
import { fieldAffectsData } from 'payload/dist/fields/config/types';
import { Field } from 'payload/types';
import { SanitizedConfig } from 'payload/config';
import { BlocksMap } from '../../utilities/createBlocksMap';
import { transform } from '.';

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
   * An array of Payload fields to traverse
   */
  fields: Field[]
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
  fields,
  path,
  relationships,
  siblingData,
  table,
}: TraverseFieldsArgs): T => {
  const sanitizedPath = path ? `${path}.` : path;

  const formatted = fields.reduce((result, field) => {
    if (fieldAffectsData(field)) {
      if (field.type === 'array') {
        const fieldData = result[field.name];

        if (Array.isArray(fieldData)) {
          if (field.localized) {
            result[field.name] = fieldData.reduce((arrayResult, row) => {
              if (typeof row._locale === 'string') {
                if (!arrayResult[row._locale]) arrayResult[row._locale] = [];

                const rowResult = traverseFields<T>({
                  blocks,
                  config,
                  data,
                  fields: field.fields,
                  path: `${sanitizedPath}${field.name}.${row._order - 1}`,
                  relationships,
                  siblingData: row,
                  table: row,
                });

                arrayResult[row._locale].push(rowResult);
                delete rowResult._locale;
              }

              return arrayResult;
            }, {});
          } else {
            result[field.name] = fieldData.map((row, i) => {
              return traverseFields<T>({
                blocks,
                config,
                data,
                fields: field.fields,
                path: `${sanitizedPath}${field.name}.${i}`,
                relationships,
                siblingData: row,
                table: row,
              });
            });
          }
        }

        return result;
      }

      if (field.type === 'blocks') {
        const blockFieldPath = `${sanitizedPath}${field.name}`;

        if (Array.isArray(blocks[blockFieldPath])) {
          if (field.localized) {
            result[field.name] = {};

            blocks[blockFieldPath].forEach((row) => {
              if (typeof row._locale === 'string') {
                if (!result[field.name][row._locale]) result[field.name][row._locale] = [];
                result[field.name][row._locale].push(row);
                delete row._locale;
              }
            });

            Object.entries(result[field.name]).forEach(([locale, localizedBlocks]) => {
              result[field.name][locale] = localizedBlocks.map((row) => {
                const block = field.blocks.find(({ slug }) => slug === row.blockType);

                if (block) {
                  const blockResult = traverseFields<T>({
                    blocks,
                    config,
                    data,
                    fields: block.fields,
                    path: `${blockFieldPath}.${row._order - 1}`,
                    relationships,
                    siblingData: row,
                    table: row,
                  });

                  delete blockResult._order;
                  return blockResult;
                }

                return {};
              });
            });
          } else {
            result[field.name] = blocks[blockFieldPath].map((row, i) => {
              delete row._order;
              const block = field.blocks.find(({ slug }) => slug === row.blockType);

              if (block) {
                return traverseFields<T>({
                  blocks,
                  config,
                  data,
                  fields: block.fields,
                  path: `${blockFieldPath}.${i}`,
                  relationships,
                  siblingData: row,
                  table: row,
                });
              }

              return {};
            });
          }
        }

        return result;
      }

      // TODO: make sure localized relationships are all written back
      if (field.type === 'relationship') {
        const relationPathMatch = relationships[`${sanitizedPath}${field.name}`];
        if (!relationPathMatch) return result;

        if (!field.hasMany) {
          const relation = relationPathMatch[0];

          if (relation) {
            // Handle hasOne Poly
            if (Array.isArray(field.relationTo)) {
              const matchedRelation = Object.entries(relation).find(([key, val]) => val !== null && !['order', 'id', 'parent'].includes(key));

              if (matchedRelation) {
                const relationTo = matchedRelation[0].replace('ID', '');

                if (typeof matchedRelation[1] === 'object') {
                  const relatedCollection = config.collections.find(({ slug }) => slug === relationTo);

                  if (relatedCollection) {
                    const value = transform({
                      config,
                      data: matchedRelation[1] as Record<string, unknown>,
                      fields: relatedCollection.fields,
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
                  fields: relatedCollection.fields,
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
                    fields: relatedCollection.fields,
                  }));
                } else {
                  transformedRelations.push(relatedData);
                }
              }
            } else {
              // Handle hasMany Poly
              const matchedRelation = Object.entries(relation).find(([key, val]) => val !== null && !['order', 'parent', 'id'].includes(key));

              if (matchedRelation) {
                const relationTo = matchedRelation[0].replace('ID', '');

                if (typeof matchedRelation[1] === 'object') {
                  const relatedCollection = config.collections.find(({ slug }) => slug === relationTo);

                  if (relatedCollection) {
                    const value = transform({
                      config,
                      data: matchedRelation[1] as Record<string, unknown>,
                      fields: relatedCollection.fields,
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
      }

      const localizedFieldData = {};
      const valuesToTransform: { localeRow: Record<string, unknown>, ref: Record<string, unknown> }[] = [];

      if (field.localized && Array.isArray(table._locales)) {
        table._locales.forEach((localeRow) => {
          valuesToTransform.push({ localeRow, ref: localizedFieldData });
        });
      } else {
        valuesToTransform.push({ localeRow: undefined, ref: result });
      }

      valuesToTransform.forEach(({ localeRow, ref }) => {
        const fieldData = localeRow?.[field.name] || ref[field.name];
        const locale = localeRow?._locale;

        switch (field.type) {
          case 'group': {
            const groupData = {};

            field.fields.forEach((subField) => {
              if (fieldAffectsData(subField)) {
                const subFieldKey = `${sanitizedPath.replace(/[.]/g, '_')}${field.name}_${subField.name}`;

                if (typeof locale === 'string') {
                  if (!ref[locale]) ref[locale] = {};
                  ref[locale][subField.name] = localeRow[subFieldKey];
                } else {
                  groupData[subField.name] = table[subFieldKey];
                  delete table[subFieldKey];
                }
              }
            });

            if (field.localized) {
              Object.entries(ref).forEach(([groupLocale, groupLocaleData]) => {
                ref[groupLocale] = traverseFields<Record<string, unknown>>({
                  blocks,
                  config,
                  data,
                  fields: field.fields,
                  path: `${sanitizedPath}${field.name}`,
                  relationships,
                  siblingData: groupLocaleData as Record<string, unknown>,
                  table,
                });
              });
            } else {
              ref[field.name] = traverseFields<Record<string, unknown>>({
                blocks,
                config,
                data,
                fields: field.fields,
                path: `${sanitizedPath}${field.name}`,
                relationships,
                siblingData: groupData as Record<string, unknown>,
                table,
              });
            }

            break;
          }

          case 'number': {
            // TODO: handle hasMany
            if (typeof fieldData === 'string') {
              const val = Number.parseFloat(fieldData);

              if (typeof locale === 'string') {
                ref[locale] = val;
              } else {
                result[field.name] = val;
              }
            }

            break;
          }

          case 'date': {
            // TODO: handle localized date fields
            if (fieldData instanceof Date) {
              result[field.name] = fieldData.toISOString();
            }

            break;
          }

          default: {
            if (typeof locale === 'string') {
              ref[locale] = fieldData;
            } else {
              result[field.name] = fieldData;
            }

            break;
          }
        }
      });

      if (Object.keys(localizedFieldData).length > 0) {
        result[field.name] = localizedFieldData;
      }

      return result;
    }

    return siblingData;
  }, siblingData);

  return formatted as T;
};
