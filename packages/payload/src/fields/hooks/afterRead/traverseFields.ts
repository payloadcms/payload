import type { PayloadRequest, RequestContext } from '../../../express/types.js';
import type { Field, TabAsField } from '../../config/types.js';

import { promise } from './promise.js';

type Args = {
  context: RequestContext
  currentDepth: number
  depth: number
  doc: Record<string, unknown>
  fieldPromises: Promise<void>[]
  fields: (Field | TabAsField)[]
  findMany: boolean
  flattenLocales: boolean
  overrideAccess: boolean
  populationPromises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
  siblingDoc: Record<string, unknown>
}

export const traverseFields = ({
  context,
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
  showHiddenFields,
  siblingDoc,
}: Args): void => {
  fields.forEach((field) => {
    fieldPromises.push(promise({
      context,
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
      showHiddenFields,
      siblingDoc,
    }));
  });
};
