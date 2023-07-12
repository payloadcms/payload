import { SanitizedCollectionConfig } from '../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../globals/config/types';
import { PayloadRequest } from '../../../express/types';
import { traverseFields } from './traverseFields';
import deepCopyObject from '../../../utilities/deepCopyObject';

type Args = {
  currentDepth?: number
  depth: number
  doc: Record<string, unknown>
  entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig
  findMany?: boolean
  flattenLocales?: boolean
  req: PayloadRequest
  overrideAccess: boolean
  showHiddenFields: boolean
}

export async function afterRead<T = any>(args: Args): Promise<T> {
  const {
    currentDepth: incomingCurrentDepth,
    depth: incomingDepth,
    doc: incomingDoc,
    entityConfig,
    findMany,
    flattenLocales = true,
    req,
    overrideAccess,
    showHiddenFields,
  } = args;

  const doc = deepCopyObject(incomingDoc);
  const fieldPromises = [];
  const populationPromises = [];

  let depth = (incomingDepth || incomingDepth === 0) ? parseInt(String(incomingDepth), 10) : req.payload.config.defaultDepth;
  if (depth > req.payload.config.maxDepth) depth = req.payload.config.maxDepth;

  const currentDepth = incomingCurrentDepth || 1;

  traverseFields({
    currentDepth,
    depth,
    doc,
    fields: entityConfig.fields,
    fieldPromises,
    findMany,
    flattenLocales,
    overrideAccess,
    populationPromises,
    req,
    siblingDoc: doc,
    showHiddenFields,
  });

  await Promise.all(fieldPromises);
  await Promise.all(populationPromises);

  return doc;
}
