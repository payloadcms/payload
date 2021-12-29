import { Payload } from '..';
import { HookName, FieldAffectingData } from './config/types';
import relationshipPopulationPromise from './relationshipPopulationPromise';
import { Operation } from '../types';
import { PayloadRequest } from '../express/types';

type Arguments = {
  data: Record<string, unknown>
  fullData: Record<string, unknown>
  originalDoc: Record<string, unknown>
  field: FieldAffectingData
  operation: Operation
  overrideAccess: boolean
  req: PayloadRequest
  id: string
  relationshipPopulations: (() => Promise<void>)[]
  depth: number
  currentDepth: number
  hook: HookName
  payload: Payload
  showHiddenFields: boolean
}

const accessPromise = async ({
  data,
  fullData,
  field,
  operation,
  overrideAccess,
  req,
  id,
  relationshipPopulations,
  depth,
  currentDepth,
  hook,
  payload,
  showHiddenFields,
}: Arguments): Promise<void> => {
  const resultingData = data;

  let accessOperation;

  if (hook === 'afterRead') {
    accessOperation = 'read';
  } else if (hook === 'beforeValidate') {
    if (operation === 'update') accessOperation = 'update';
    if (operation === 'create') accessOperation = 'create';
  }

  if (field.access && field.access[accessOperation]) {
    const result = overrideAccess ? true : await field.access[accessOperation]({ req, id, siblingData: data, data: fullData });

    if (!result) {
      delete resultingData[field.name];
    }
  }

  if ((field.type === 'relationship' || field.type === 'upload') && hook === 'afterRead') {
    relationshipPopulations.push(relationshipPopulationPromise({
      showHiddenFields,
      data,
      field,
      depth,
      currentDepth,
      req,
      overrideAccess,
      payload,
    }));
  }
};

export default accessPromise;
