import { Field } from '../../config/types';
import { promise } from './promise';
import { PayloadRequest } from '../../../express/types';

type Args = {
  currentDepth: number
  depth: number
  doc: Record<string, unknown>
  fieldPromises: Promise<void>[]
  fields: Field[]
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
      flattenLocales,
      overrideAccess,
      populationPromises,
      req,
      siblingDoc,
      showHiddenFields,
    }));
  });
};
