import { Fields } from './types';
declare const getDataByPath: <T = unknown>(fields: Fields, path: string) => T;
export default getDataByPath;
