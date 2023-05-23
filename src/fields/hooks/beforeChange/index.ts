import { SanitizedCollectionConfig } from '../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../globals/config/types';
import { Operation } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { traverseFields } from './traverseFields';
import { ValidationError } from '../../../errors';
import deepCopyObject from '../../../utilities/deepCopyObject';

type Args<T> = {
  data: T | Record<string, unknown>
  doc: T | Record<string, unknown>
  docWithLocales: Record<string, unknown>
  entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig
  id?: string | number
  operation: Operation
  req: PayloadRequest
  skipValidation?: boolean
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
  });

  if (errors.length > 0) {
    throw new ValidationError(errors, req.t);
  }

  mergeLocaleActions.forEach((action) => action());

  return data;
};
