/* eslint-disable @typescript-eslint/no-use-before-define */
import { Collection } from '../../collections/config/types';
import { RichTextField, Field } from '../config/types';
import { PayloadRequest } from '../../express/types';

type Arguments = {
  data: unknown
  overrideAccess?: boolean
  key: string | number
  depth: number
  currentDepth?: number
  field: RichTextField
  req: PayloadRequest
  showHiddenFields: boolean
}

export const populate = async ({
  id,
  collection,
  data,
  key,
  overrideAccess,
  depth,
  currentDepth,
  req,
  showHiddenFields,
  field,
}: Omit<Arguments, 'field'> & {
  id: string,
  field: Field
  collection: Collection
}): Promise<void> => {
  const dataRef = data as Record<string, unknown>;

  const doc = await req.payload.findByID({
    req,
    collection: collection.config.slug,
    id,
    currentDepth: currentDepth + 1,
    overrideAccess: typeof overrideAccess === 'undefined' ? false : overrideAccess,
    disableErrors: true,
    depth,
    showHiddenFields,
  });

  if (doc) {
    if (field.type === 'richText' && field.select && req.payloadAPI !== 'graphQL') {
      const fieldsOrTrue = field.select({
        data: doc,
        collection: collection.config,
        siblingData: dataRef,
      });
      if (fieldsOrTrue !== true) {
        // if fieldsOrTrue is true then we want to return the entire related document
        const newDoc = {
          id: doc.id,
        };
        fieldsOrTrue.forEach((fieldName) => {
          if (doc[fieldName] !== undefined) {
            newDoc[fieldName] = doc[fieldName];
          }
        });
        dataRef[key] = newDoc;
      } else {
        dataRef[key] = doc;
      }
    } else {
      dataRef[key] = doc;
    }
  } else {
    dataRef[key] = null;
  }
};
