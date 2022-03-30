import { unflatten } from 'flatley';
import { Fields } from './types';

const getDataByPath = <T = unknown>(fields: Fields, path: string): T => {
  const pathPrefixToRemove = path.substring(0, path.lastIndexOf('.') + 1);
  const name = path.split('.').pop();

  const data = {};
  Object.keys(fields).forEach((key) => {
    if (!fields[key].disableFormData && (key.indexOf(`${path}.`) === 0 || key === path)) {
      data[key.replace(pathPrefixToRemove, '')] = fields[key].value;
    }
  });

  const unflattenedData = unflatten(data);

  return unflattenedData?.[name];
};

export default getDataByPath;
