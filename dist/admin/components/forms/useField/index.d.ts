import { Options, FieldType } from './types';
/**
 * Get and set the value of a form field.
 *
 * @see https://payloadcms.com/docs/admin/hooks#usefield
 */
declare const useField: <T extends unknown>(options: Options) => FieldType<T>;
export default useField;
