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

  if (field.access && field.access[operation]) {
    const result = overrideAccess ? true : await field.access[operation]({ req, id });

    if (!result && operation === 'update' && originalDoc[field.name] !== undefined) {
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
