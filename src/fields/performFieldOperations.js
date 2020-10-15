const { ValidationError } = require('../errors');
const sanitizeFallbackLocale = require('../localization/sanitizeFallbackLocale');
const traverseFields = require('./traverseFields');

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
    showHiddenFields,
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
    showHiddenFields,
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
