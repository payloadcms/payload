import { Payload } from '..';
import { ValidationError } from '../errors';
import sanitizeFallbackLocale from '../localization/sanitizeFallbackLocale';
import traverseFields from './traverseFields';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { SanitizedGlobalConfig } from '../globals/config/types';
import { Operation } from '../types';
import { PayloadRequest } from '../express/types';
import { HookName } from './config/types';
import deepCopyObject from '../utilities/deepCopyObject';

type Arguments = {
  data: Record<string, unknown>
  operation: Operation
  hook?: HookName
  req: PayloadRequest
  overrideAccess: boolean
  flattenLocales?: boolean
  unflattenLocales?: boolean
  originalDoc?: Record<string, unknown>
  docWithLocales?: Record<string, unknown>
  id?: string | number
  showHiddenFields?: boolean
  depth?: number
  currentDepth?: number
  isVersion?: boolean
}

export default async function performFieldOperations(this: Payload, entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig, args: Arguments): Promise<any> {
  const {
    data,
    originalDoc: fullOriginalDoc,
    docWithLocales,
    operation,
    hook,
    req,
    id,
    req: {
      payloadAPI,
      locale,
    },
    overrideAccess,
    flattenLocales,
    unflattenLocales = false,
    showHiddenFields = false,
    isVersion = false,
  } = args;

  const fullData = deepCopyObject(data);

  const fallbackLocale = sanitizeFallbackLocale(req.fallbackLocale);

  let depth = 0;

  if (payloadAPI === 'REST' || payloadAPI === 'local') {
    depth = (args.depth || args.depth === 0) ? parseInt(String(args.depth), 10) : this.config.defaultDepth;

    if (depth > this.config.maxDepth) depth = this.config.maxDepth;
  }

  const currentDepth = args.currentDepth || 1;

  // Maintain a top-level list of promises
  // so that all async field access / validations / hooks
  // can run in parallel
  const validationPromises = [];
  const accessPromises = [];
  const relationshipPopulations = [];
  const hookPromises = [];
  const unflattenLocaleActions = [];
  const transformActions = [];
  const errors: { message: string, field: string }[] = [];

  // //////////////////////////////////////////
  // Entry point for field validation
  // //////////////////////////////////////////

  traverseFields({
    fields: entityConfig.fields,
    data: fullData,
    originalDoc: fullOriginalDoc,
    path: '',
    flattenLocales,
    locale,
    fallbackLocale,
    accessPromises,
    operation,
    overrideAccess,
    req,
    id,
    relationshipPopulations,
    depth,
    currentDepth,
    hook,
    hookPromises,
    fullOriginalDoc,
    fullData,
    validationPromises,
    errors,
    payload: this,
    showHiddenFields,
    unflattenLocales,
    unflattenLocaleActions,
    transformActions,
    docWithLocales,
    isVersion,
  });

  if (hook === 'afterRead') {
    transformActions.forEach((action) => action());
  }

  const hookResults = hookPromises.map((promise) => promise());
  await Promise.all(hookResults);

  validationPromises.forEach((promise) => promise());
  await Promise.all(validationPromises);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  if (hook === 'beforeChange') {
    transformActions.forEach((action) => action());
  }

  unflattenLocaleActions.forEach((action) => action());

  const accessResults = accessPromises.map((promise) => promise());
  await Promise.all(accessResults);

  const relationshipPopulationResults = relationshipPopulations.map((population) => population());
  await Promise.all(relationshipPopulationResults);

  return fullData;
}
