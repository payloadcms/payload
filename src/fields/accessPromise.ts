const relationshipPopulationPromise = require('./relationshipPopulationPromise');

const accessPromise = async ({
  data,
  originalDoc,
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
}) => {
  const resultingData = data;

  let accessOperation;

  if (hook === 'afterRead') {
    accessOperation = 'read';
  } else if (hook === 'beforeValidate') {
    if (operation === 'update') accessOperation = 'update';
    if (operation === 'create') accessOperation = 'create';
  }

  if (field.access && field.access[accessOperation]) {
    const result = overrideAccess ? true : await field.access[accessOperation]({ req, id });

    if (!result && accessOperation === 'update' && originalDoc[field.name] !== undefined) {
      resultingData[field.name] = originalDoc[field.name];
    } else if (!result) {
      delete resultingData[field.name];
    }
  }

  if ((field.type === 'relationship' || field.type === 'upload') && hook === 'afterRead') {
    relationshipPopulations.push(relationshipPopulationPromise({
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

module.exports = accessPromise;
