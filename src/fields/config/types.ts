import { CSSProperties } from 'react';
import { PayloadRequest } from '../../express/types/payloadRequest';

// TODO: add generic type and use mongoose types for originalDoc & data
export type FieldHook = (args: {
  value?: any,
  originalDoc?: any,
  data?: any,
  operation?: 'create' | 'update',
  req?: PayloadRequest}) => Promise<any> | any;

export type Field = {
  name: string;
  label?: string;
  type:
  | 'number'
  | 'text'
  | 'email'
  | 'textarea'
  | 'richText'
  | 'code'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'upload'
  | 'relationship'
  | 'row'
  | 'array'
  | 'group'
  | 'select'
  | 'blocks';
  localized?: boolean;
  hidden?: boolean;
  fields?: Field[];
  hooks?: {
    beforeValidate?: FieldHook[];
    beforeChange?: FieldHook[];
    afterChange?: FieldHook[];
    afterRead?: FieldHook[];
  }
  admin?: {
    position?: string;
    width?: string;
    style?: CSSProperties;
    readOnly?: boolean;
    disabled?: boolean;
  };
};
