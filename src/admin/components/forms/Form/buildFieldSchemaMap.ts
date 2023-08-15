import { Field } from '../../../../fields/config/types';
import { createNestedFieldPath } from './createNestedFieldPath';

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

  const buildUpMap = (fields: Field[], parentPath = '') => {
    fields.forEach((field) => {
      const path = createNestedFieldPath(parentPath, field);

      switch (field.type) {
        case 'blocks':
          field.blocks.forEach((block) => {
            const blockPath = `${path}.${block.slug}`;
            fieldMap.set(blockPath, block.fields);
            buildUpMap(block.fields, blockPath);
          });
          break;

        case 'array':
          fieldMap.set(path, field.fields);
          buildUpMap(field.fields, path);
          break;

        case 'row':
        case 'collapsible':
        case 'group':
          buildUpMap(field.fields, path);
          break;

        case 'tabs':
          field.tabs.forEach((tab) => {
            let tabPath = path;
            if (tabPath) {
              tabPath = 'name' in tab ? `${tabPath}.${tab.name}` : tabPath;
            } else {
              tabPath = 'name' in tab ? `${tab.name}` : tabPath;
            }
            buildUpMap(tab.fields, tabPath);
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
