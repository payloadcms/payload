import React from 'react';
import { Model, Document } from 'mongoose';
import { DeepRequired } from 'ts-essentials';
import { PayloadRequest } from '../../express/types';
import { Access } from '../../config/types';
import { Field } from '../../fields/config/types';

export type BeforeValidateHook = (args?: {
  data?: any;
  req?: PayloadRequest;
  originalDoc?: any;
}) => any;

export type BeforeChangeHook = (args?: {
  data: any;
  req: PayloadRequest;
  originalDoc?: any;
}) => any;

export type AfterChangeHook = (args?: {
  doc: any;
  req: PayloadRequest;
}) => any;

export type BeforeReadHook = (args?: {
  doc: any;
  req: PayloadRequest;
  query: { [key: string]: any };
}) => any;

export type AfterReadHook = (args?: {
  doc: any;
  req: PayloadRequest;
  query?: { [key: string]: any };
}) => any;

export type GlobalModel = Model<Document>

export type PayloadGlobalConfig = {
  slug: string
  label?: string
  preview?: (doc: Document, token: string) => string
  hooks?: {
    beforeValidate?: BeforeValidateHook[]
    beforeChange?: BeforeChangeHook[]
    afterChange?: AfterChangeHook[]
    beforeRead?: BeforeReadHook[]
    afterRead?: AfterReadHook[]
  }
  access?: {
    read?: Access;
    update?: Access;
    admin?: Access;
  }
  fields: Field[];
  admin?: {
    components?: {
      views?: {
        Edit?: React.ComponentType
      }
    }
  }
}

export interface GlobalConfig extends Omit<DeepRequired<PayloadGlobalConfig>, 'fields'> {
  fields: Field[]
}

export type Globals = {
  Model: GlobalModel
  config: GlobalConfig[]
}
