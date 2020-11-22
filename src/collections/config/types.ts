import { Access, Hook } from '../../config/types';
import { Field } from '../../fields/config/types';
import { PayloadRequest } from '../../express/types/payloadRequest';

export type ImageSize = {
  name: string,
  width: number,
  height: number,
  crop: string, // comes from sharp package
};

export type Collection = {
  slug: string;
  labels?: {
    singular: string;
    plural: string;
  };
  admin?: {
    useAsTitle?: string;
    defaultColumns?: string[];
    components?: any;
  };
  hooks?: {
    beforeOperation?: Hook[];
    beforeValidate?: Hook[];
    beforeChange?: Hook[];
    afterChange?: Hook[];
    beforeRead?: Hook[];
    afterRead?: Hook[];
    beforeDelete?: Hook[];
    afterDelete?: Hook[];
    beforeLogin?: Hook[];
    afterLogin?: Hook[];
    afterForgotPassword?: Hook[];
    forgotPassword?: Hook[];
  };
  access?: {
    create?: Access;
    read?: Access;
    update?: Access;
    delete?: Access;
    admin?: Access;
    unlock?: Access;
  };
  auth?: {
    tokenExpiration?: number;
    verify?:
    | boolean
    | { generateEmailHTML: string; generateEmailSubject: string };
    maxLoginAttempts?: number;
    lockTime?: number;
    useAPIKey?: boolean;
    cookies?:
    | {
      secure?: boolean;
      sameSite?: string;
      domain?: string | undefined;
    }
    | boolean;
    forgotPassword?: {
      generateEmailHTML?: (args?: {token?: string, email?: string, req?: PayloadRequest}) => string,
      generateEmailSubject?: (args?: {req?: PayloadRequest}) => string,
    }
  };
  config: {[key: string]: any};
  fields: Field[];
  upload: {
    imageSizes: ImageSize[];
    staticURL: string;
    staticDir: string;
  };
};
