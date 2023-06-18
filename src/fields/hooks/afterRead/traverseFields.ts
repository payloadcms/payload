import { Field, TabAsField } from '../../config/types';
import { promise } from './promise';
import { PayloadRequest } from '../../../express/types';

type Args = {
  currentDepth: number
  depth: number
  doc: Record<string, unknown>
  fieldPromises: Promise<void>[]
  fields: (Field | TabAsField)[]
  findMany: boolean
  flattenLocales: boolean
  populationPromises: Promise<void>[]
  req: PayloadRequest
  overrideAccess: boolean
  siblingDoc: Record<string, unknown>
  showHiddenFields: boolean
}

export const traverseFields = ({
  currentDepth,
  depth,
  doc,
  fieldPromises,
  fields,
  findMany,
  flattenLocales,
  overrideAccess,
  populationPromises,
  req,
  siblingDoc,
  showHiddenFields,
}: Args): void => {
  fields.forEach((field) => {
    fieldPromises.push(promise({
      currentDepth,
      depth,
      doc,
      field,
      fieldPromises,
      findMany,
      flattenLocales,
      overrideAccess,
      populationPromises,
      req,
      siblingDoc,
      showHiddenFields,
    }));
  });
};
