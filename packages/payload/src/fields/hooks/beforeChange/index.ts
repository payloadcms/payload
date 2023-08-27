import { SanitizedCollectionConfig } from '../../../collections/config/types.js';
import { SanitizedGlobalConfig } from '../../../globals/config/types.js';
import { Operation } from '../../../types.js';
import { PayloadRequest, RequestContext } from '../../../express/types.js';
import { traverseFields } from './traverseFields.js';
import { ValidationError } from '../../../errors.js';
import deepCopyObject from '../../../utilities/deepCopyObject.js';

type Args<T> = {
  data: T | Record<string, unknown>
  doc: T | Record<string, unknown>
  docWithLocales: Record<string, unknown>
  entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig
  id?: string | number
  operation: Operation
  req: PayloadRequest
  skipValidation?: boolean
  context: RequestContext
}

export const beforeChange = async <T extends Record<string, unknown>>({
  data: incomingData,
  doc,
  docWithLocales,
  entityConfig,
  id,
  operation,
  req,
  skipValidation,
  context,
}: Args<T>): Promise<T> => {
  const data = deepCopyObject(incomingData);
  const mergeLocaleActions = [];
  const errors: { message: string, field: string }[] = [];

  await traverseFields({
    data,
    doc,
    docWithLocales,
    errors,
    id,
    operation,
    path: '',
    mergeLocaleActions,
    req,
    siblingData: data,
    siblingDoc: doc,
    siblingDocWithLocales: docWithLocales,
    fields: entityConfig.fields,
    skipValidation,
    context,
  });

  if (errors.length > 0) {
    throw new ValidationError(errors, req.t);
  }

  mergeLocaleActions.forEach((action) => action());

  return data;
};
