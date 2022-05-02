import { SanitizedCollectionConfig } from '../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../globals/config/types';
import { Operation } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { traverseFields } from './traverseFields';
import { ValidationError } from '../../../errors';
import deepCopyObject from '../../../utilities/deepCopyObject';

type Args = {
  data: Record<string, unknown>
  doc: Record<string, unknown>
  docWithLocales: Record<string, unknown>
  entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig
  id?: string | number
  operation: Operation
  req: PayloadRequest
  skipValidation?: boolean
}

export const beforeChange = async ({
  data: incomingData,
  doc,
  docWithLocales,
  entityConfig,
  id,
  operation,
  req,
  skipValidation,
}: Args): Promise<Record<string, unknown>> => {
  const data = deepCopyObject(incomingData);
  const promises = [];
  const mergeLocaleActions = [];
  const errors: { message: string, field: string }[] = [];

  traverseFields({
    data,
    doc,
    docWithLocales,
    errors,
    id,
    operation,
    path: '',
    mergeLocaleActions,
    promises,
    req,
    siblingData: data,
    siblingDoc: doc,
    siblingDocWithLocales: docWithLocales,
    fields: entityConfig.fields,
    skipValidation,
  });

  await Promise.all(promises);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  mergeLocaleActions.forEach((action) => action());

  return data;
};
