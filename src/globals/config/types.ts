import React from 'react';
import { Model, Document } from 'mongoose';
import { DeepRequired } from 'ts-essentials';
import { PayloadRequest } from '../../express/types';
import { Access, GeneratePreviewURL } from '../../config/types';
import { Field } from '../../fields/config/types';

export type BeforeValidateHook = (args: {
  data?: any;
  req?: PayloadRequest;
  originalDoc?: any;
}) => any;

export type BeforeChangeHook = (args: {
  data: any;
  req: PayloadRequest;
  originalDoc?: any;
}) => any;

export type AfterChangeHook = (args: {
  doc: any;
  req: PayloadRequest;
}) => any;

export type BeforeReadHook = (args: {
  doc: any;
  req: PayloadRequest;
  query: { [key: string]: any };
}) => any;

export type AfterReadHook = (args: {
  doc: any;
  req: PayloadRequest;
  query?: { [key: string]: any };
}) => any;

export type GlobalModel = Model<Document>

export type GlobalConfig = {
  slug: string
  label?: string
  preview?: GeneratePreviewURL
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
    description?: string | (() => string);
    components?: {
      views?: {
        Edit?: React.ComponentType
      }
    }
  }
}

export interface SanitizedGlobalConfig extends Omit<DeepRequired<GlobalConfig>, 'fields'> {
  fields: Field[]
}

export type Globals = {
  Model: GlobalModel
  config: SanitizedGlobalConfig[]
}
