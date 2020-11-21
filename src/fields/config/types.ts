import { CSSProperties } from 'react';

export type Field = {
  name: string;
  label: string;
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
  fields?: Field[];
  admin?: {
    position?: string;
    width?: string;
    style?: CSSProperties;
  };
};
