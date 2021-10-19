import { Validate } from '../fields/config/types';

export const mimeTypeValidator = (mimeTypes: string[]): Validate => (val: string) => {
  const cleanedMimeTypes = mimeTypes.map((v) => v.replace('*', ''));

  return !cleanedMimeTypes.some((v) => val.startsWith(v))
    ? `Invalid file type: '${val}'`
    : true;
};
