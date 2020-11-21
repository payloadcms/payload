import { Access } from '../../config/types';
import { Field } from '../../fields/config/types';

export type Global = {
  slug: string;
  label: string;
  access?: {
    create?: Access;
    read?: Access;
    update?: Access;
    delete?: Access;
    admin?: Access;
  };
  fields: Field[];
};
