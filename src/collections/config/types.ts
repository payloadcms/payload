import { Access, Hook } from '../../config/types';
import { Field } from '../../fields/config/types';

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
  };
  access?: {
    create?: Access;
    read?: Access;
    update?: Access;
    delete?: Access;
    admin?: Access;
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
  };
  fields: Field[];
};
