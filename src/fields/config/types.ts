/* eslint-disable no-use-before-define */
import joi from 'joi';
import { CSSProperties } from 'react';
import 'joi-extract-type';
import { DeepRequired } from 'ts-essentials';
import { PayloadRequest } from '../../express/types/payloadRequest';
import { Access } from '../../config/types';
import {
  baseField,
  adminFields,
  text,
  number,
  textarea,
  email,
  code,
  select,
  row,
} from './schema';

// TODO: add generic type and use mongoose types for originalDoc & data
export type FieldHook = (args: {
  value?: unknown,
  originalDoc?: unknown,
  data?: unknown,
  operation?: 'create' | 'update',
  req?: PayloadRequest
}) => Promise<unknown> | unknown;

type BaseFieldFromSchema = joi.extractType<typeof baseField>;
type BaseAdminFieldsFromSchema = joi.extractType<typeof adminFields>;

interface BaseAdminFields extends BaseAdminFieldsFromSchema {
  style: CSSProperties
}

interface BaseField extends BaseFieldFromSchema {
  access: {
    create: Access
    read: Access
    update: Access
  }
  hooks: {
    beforeValidate: FieldHook[]
    beforeChange: FieldHook[]
    afterChange: FieldHook[]
    afterRead: FieldHook[]
  }
  admin: BaseAdminFields
}

type TextFromSchema = joi.extractType<typeof text>;
export interface TextField extends BaseField, TextFromSchema {}

type NumberFromSchema = joi.extractType<typeof number>;
export interface NumberField extends BaseField, NumberFromSchema {}

type TextareaFromSchema = joi.extractType<typeof textarea>;
export interface TextareaField extends BaseField, TextareaFromSchema {}

type EmailFromSchema = joi.extractType<typeof email>;
export interface EmailField extends BaseField, EmailFromSchema {}

type CodeFromSchema = joi.extractType<typeof code>;
export interface CodeField extends BaseField, CodeFromSchema {}

type SelectFromSchema = joi.extractType<typeof select>;
export interface SelectField extends BaseField, SelectFromSchema {}

type RowFromSchema = joi.extractType<typeof row>;
export interface RowField extends BaseField, RowFromSchema {}

type PayloadFieldConfig =
  TextField
  | NumberField
  | TextareaField
  | EmailField
  | CodeField
  | SelectField
  | RowField

export type FieldConfig = DeepRequired<PayloadFieldConfig>
