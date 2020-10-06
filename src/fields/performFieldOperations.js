const memoize = require('micro-memoize');
const { ValidationError } = require('../errors');
const sanitizeFallbackLocale = require('../localization/sanitizeFallbackLocale');
const traverseFields = require('./traverseFields');
const executeAccess = require('../auth/executeAccess');

async function performFieldOperations(entityConfig, args) {
  const {
    data: fullData,
    originalDoc: fullOriginalDoc,
    operation,
    hook,
    req,
    id,
    req: {
      payloadAPI,
      locale,
    },
    overrideAccess,
    reduceLocales,
  } = args;

  const recursivePerformFieldOperations = performFieldOperations.bind(this);

  const fallbackLocale = sanitizeFallbackLocale(req.fallbackLocale);

  let depth = 0;

  if (payloadAPI === 'REST' || payloadAPI === 'local') {
    depth = (args.depth || args.depth === 0) ? parseInt(args.depth, 10) : this.config.defaultDepth;

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
  const errors = [];

  // ////////////////////////////////////////////////////////////////
  // Create memoized Populate function — with the same input (ID),
  // it will return the same result without re-querying.
  // Note - this function is recreated each time a request comes in
  // ////////////////////////////////////////////////////////////////

  const nonMemoizedPopulate = async (
    data,
    dataReference,
    field,
    index,
  ) => {
    const dataToUpdate = dataReference;

    const relation = Array.isArray(field.relationTo) ? data.relationTo : field.relationTo;
    const relatedCollection = this.collections[relation];

    if (relatedCollection) {
      const accessResult = !overrideAccess ? await executeAccess({ req, disableErrors: true, id }, relatedCollection.config.access.read) : true;

      let populatedRelationship = null;

      if (accessResult && (depth && currentDepth <= depth)) {
        let idString = Array.isArray(field.relationTo) ? data.value : data;

        if (typeof idString !== 'string') {
          idString = idString.toString();
        }

        populatedRelationship = await this.operations.collections.findByID({
          req,
          collection: relatedCollection,
          id: idString,
          currentDepth: currentDepth + 1,
          disableErrors: true,
          depth,
        });
      }

      // If access control fails, update value to null
      // If populatedRelationship comes back, update value
      if (!accessResult || populatedRelationship) {
        if (typeof index === 'number') {
          if (Array.isArray(field.relationTo)) {
            dataToUpdate[field.name][index].value = populatedRelationship;
          } else {
            dataToUpdate[field.name][index] = populatedRelationship;
          }
        } else if (Array.isArray(field.relationTo)) {
          dataToUpdate[field.name].value = populatedRelationship;
        } else {
          dataToUpdate[field.name] = populatedRelationship;
        }
      }
    }
  };

  const populate = memoize(nonMemoizedPopulate, {
    isPromise: true,
  });

  // //////////////////////////////////////////
  // Entry point for field validation
  // //////////////////////////////////////////

  traverseFields({
    fields: entityConfig.fields,
    data: fullData,
    originalDoc: fullOriginalDoc,
    path: '',
    reduceLocales,
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
    performFieldOperations: recursivePerformFieldOperations,
    validationPromises,
    errors,
    payload: this,
    populate,
  });

  await Promise.all(hookPromises);

  validationPromises.forEach((promise) => promise());

  await Promise.all(validationPromises);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  await Promise.all(accessPromises);

  const relationshipPopulationPromises = relationshipPopulations.map((population) => population());

  await Promise.all(relationshipPopulationPromises);

  return fullData;
}


module.exports = performFieldOperations;
