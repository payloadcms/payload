import React from 'react';
import { Model, Document } from 'mongoose';
import { DeepRequired } from 'ts-essentials';
import { Access } from '../../config/types';
import { Field } from '../../fields/config/types';

export type GlobalModel = Model<Document>

export type PayloadGlobalConfig = {
  slug: string
  label?: string
  preview?: (doc: Document, token: string) => string
  access?: {
    create?: Access;
    read?: Access;
    update?: Access;
    delete?: Access;
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

export type GlobalConfig = DeepRequired<PayloadGlobalConfig>

export type Globals = {
  Model: GlobalModel
  config: GlobalConfig[]
}
