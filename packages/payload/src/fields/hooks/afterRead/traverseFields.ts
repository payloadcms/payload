import { Field, TabAsField } from '../../config/types.js';
import { promise } from './promise.js';
import { PayloadRequest, RequestContext } from '../../../express/types.js';

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
  context: RequestContext
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
  context,
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
      context,
    }));
  });
};
