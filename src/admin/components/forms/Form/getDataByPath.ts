import { unflatten } from 'flatley';
import reduceFieldsToValues from './reduceFieldsToValues';
import { Fields } from './types';

const getDataByPath = (fields: Fields, path: string): unknown => {
  const pathPrefixToRemove = path.substring(0, path.lastIndexOf('.') + 1);
  const name = path.split('.').pop();

  const data = Object.keys(fields).reduce((matchedData, key) => {
    if (key.indexOf(`${path}.`) === 0 || key === path) {
      return {
        ...matchedData,
        [key.replace(pathPrefixToRemove, '')]: fields[key],
      };
    }

    return matchedData;
  }, {});

  const values = reduceFieldsToValues(data, true);
  const unflattenedData = unflatten(values);

  return unflattenedData?.[name];
};

export default getDataByPath;
