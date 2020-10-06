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
  hook,
  populate,
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
      populate,
    }));
  }
};

module.exports = accessPromise;
