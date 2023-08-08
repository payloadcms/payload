import { Field } from '../fields/config/types';

/**
 * **Returns Map with array and block field schemas**
 * - Takes entity fields and returns a Map to retrieve field schemas by path without indexes
 *
 * **Accessing field schemas**
 * - array fields: indexes must be removed from path i.e. `array.innerArray` instead of `array.0.innerArray`
 * - block fields: the block slug must be appended to the path `blocksFieldName.blockSlug` instead of `blocksFieldName`
 *
 * @param entityFields
 * @returns Map<string, Field[]>
 */
export const buildFieldSchemaMap = (entityFields: Field[]): Map<string, Field[]> => {
  const fieldMap = new Map<string, Field[]>();

  const buildUpMap = (fields: Field[], builtUpPath = '') => {
    fields.forEach((field) => {
      let nextPath = builtUpPath;

      if (nextPath) {
        if ('name' in field && field?.name) {
          nextPath = `${nextPath}.${field.name}`;
        }
      } else if ('name' in field && field?.name) {
        nextPath = field.name;
      }

      switch (field.type) {
        case 'blocks':
          field.blocks.forEach((block) => {
            fieldMap.set(`${nextPath}.${block.slug}`, block.fields);
            buildUpMap(block.fields, nextPath);
          });
          break;

        case 'array':
          fieldMap.set(nextPath, field.fields);
          buildUpMap(field.fields, nextPath);
          break;

        case 'row':
        case 'collapsible':
        case 'group':
          buildUpMap(field.fields, nextPath);
          break;

        case 'tabs':
          field.tabs.forEach((tab) => {
            if (nextPath) {
              nextPath = 'name' in tab ? `${nextPath}.${tab.name}` : nextPath;
            } else {
              nextPath = 'name' in tab ? `${tab.name}` : nextPath;
            }
            buildUpMap(tab.fields, nextPath);
          });
          break;

        default:
          break;
      }
    });
  };

  buildUpMap(entityFields);

  return fieldMap;
};
