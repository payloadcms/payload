const { isValidObjectId } = require('mongoose');
const { ValidationError } = require('../errors');
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
    },
    overrideAccess,
  } = args;

  const recursivePerformFieldOperations = performFieldOperations.bind(this);

  let depth = 0;

  if (payloadAPI === 'REST' || payloadAPI === 'local') {
    depth = (args.depth || args.depth === 0) ? parseInt(args.depth, 10) : this.config.defaultDepth;
  }

  const currentDepth = args.currentDepth || 1;

  const populateRelationship = async (dataReference, data, field, i) => {
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
        if (typeof i === 'number') {
          if (Array.isArray(field.relationTo)) {
            dataToUpdate[field.name][i].value = populatedRelationship;
          } else {
            dataToUpdate[field.name][i] = populatedRelationship;
          }
        } else if (Array.isArray(field.relationTo)) {
          dataToUpdate[field.name].value = populatedRelationship;
        } else {
          dataToUpdate[field.name] = populatedRelationship;
        }
      }
    }
  };

  // Maintain a top-level list of promises
  // so that all async field access / validations / hooks
  // can run in parallel
  const validationPromises = [];
  const accessPromises = [];
  const relationshipPopulations = [];
  const hookPromises = [];
  const errors = [];

  const createValidationPromise = async (newData, existingData, field, path) => {
    if (hook === 'beforeValidate') return true;

    const hasCondition = field.admin && field.admin.condition;
    const shouldValidate = field.validate && !hasCondition;

    let valueToValidate = newData[field.name];
    if (valueToValidate === undefined) valueToValidate = existingData[field.name];
    if (valueToValidate === undefined) valueToValidate = field.defaultValue;

    const result = shouldValidate ? await field.validate(valueToValidate, field) : true;

    if (!result || typeof result === 'string') {
      errors.push({
        message: result,
        field: `${path}${field.name}`,
      });
    }

    return result;
  };

  const createRelationshipPopulationPromise = (data, field) => async () => {
    const resultingData = data;

    if (field.hasMany && Array.isArray(data[field.name])) {
      const rowPromises = [];

      data[field.name].forEach((relatedDoc, i) => {
        const rowPromise = async () => {
          if (relatedDoc) {
            await populateRelationship(resultingData, relatedDoc, field, i);
          }
        };

        rowPromises.push(rowPromise());
      });

      await Promise.all(rowPromises);
    } else if (data[field.name]) {
      await populateRelationship(resultingData, data[field.name], field);
    }
  };

  const createAccessPromise = async (data, originalDoc, field) => {
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
      relationshipPopulations.push(createRelationshipPopulationPromise(data, field));
    }
  };

  const createHookPromise = async (data, originalDoc, field) => {
    const resultingData = data;

    if ((field.type === 'relationship' || field.type === 'upload') && (data[field.name] === 'null' || data[field.name] === null)) {
      resultingData[field.name] = null;
    }

    if (hook === 'afterRead') {
      if ((field.type === 'relationship' || field.type === 'upload')) {
        const hasManyRelations = Array.isArray(field.relationTo);

        // If there are many related documents
        if (field.hasMany && Array.isArray(data[field.name])) {
          const relationshipDocPromises = [];
          // Loop through relations
          data[field.name].forEach((value, i) => {
            const generateRelationshipDocPromise = async () => {
              let relation = field.relationTo;

              // If this field can be related to many collections,
              // Set relationTo based on value
              if (hasManyRelations && value && value.relationTo) {
                relation = value.relationTo;
              }

              if (relation) {
                const relatedCollection = this.collections[relation].config;

                if (relatedCollection) {
                  let relatedDocumentData = data[field.name][i];
                  let dataToHook = resultingData[field.name][i];

                  if (hasManyRelations) {
                    relatedDocumentData = data[field.name][i].value;
                    dataToHook = resultingData[field.name][i].value;
                  }

                  // Only run hooks for populated sub documents - NOT IDs
                  if (relatedDocumentData && !isValidObjectId(relatedDocumentData)) {
                    // Perform field hooks on related collection
                    dataToHook = await recursivePerformFieldOperations(relatedCollection, {
                      req,
                      data: relatedDocumentData,
                      hook: 'afterRead',
                      operation: 'read',
                    });

                    await relatedCollection.hooks.afterRead.reduce(async (priorHook, currentHook) => {
                      await priorHook;

                      dataToHook = await currentHook({
                        req,
                        doc: relatedDocumentData,
                      }) || dataToHook;
                    }, Promise.resolve());
                  }
                }
              }
            };

            relationshipDocPromises.push(generateRelationshipDocPromise());
          });

          await Promise.all(relationshipDocPromises);

          // Otherwise, there is only one related document
        } else {
          let relation = field.relationTo;

          if (hasManyRelations && data[field.name] && data[field.name].relationTo) {
            relation = data[field.name].relationTo;
          }

          if (typeof relation === 'string') {
            const relatedCollection = this.collections[relation].config;
            let relatedDocumentData = data[field.name];
            let dataToHook = resultingData[field.name];

            if (hasManyRelations) {
              relatedDocumentData = data[field.name].value;
              dataToHook = resultingData[field.name].value;
            }

            // Only run hooks for populated sub documents - NOT IDs
            if (relatedDocumentData && !isValidObjectId(relatedDocumentData)) {
              // Perform field hooks on related collection
              dataToHook = await recursivePerformFieldOperations(relatedCollection, {
                req,
                data: relatedDocumentData,
                hook: 'afterRead',
                operation: 'read',
              });

              await relatedCollection.hooks.afterRead.reduce(async (priorHook, currentHook) => {
                await priorHook;

                dataToHook = await currentHook({
                  req,
                  doc: relatedDocumentData,
                }) || dataToHook;
              }, Promise.resolve());
            }
          }
        }
      }
    }

    if (field.hooks && field.hooks[hook]) {
      await field.hooks[hook].reduce(async (priorHook, currentHook) => {
        await priorHook;

        const hookedValue = await currentHook({
          value: data[field.name],
          originalDoc: fullOriginalDoc,
          data: fullData,
          operation,
          req,
        });

        if (hookedValue !== undefined) {
          resultingData[field.name] = hookedValue;
        }
      }, Promise.resolve());
    }
  };

  const traverseFields = (fields, data = {}, originalDoc = {}, path) => {
    fields.forEach((field) => {
      const dataCopy = data;

      if (field.type === 'upload') {
        if (data[field.name] === '') dataCopy[field.name] = null;
      }

      // TODO: sanitize additional field types as necessary i.e. relationships

      if (field.type === 'checkbox') {
        if (data[field.name] === 'true') dataCopy[field.name] = true;
        if (data[field.name] === 'false') dataCopy[field.name] = false;
      }

      accessPromises.push(createAccessPromise(data, originalDoc, field));
      hookPromises.push(createHookPromise(data, originalDoc, field));

      if (field.fields) {
        if (field.name === undefined) {
          traverseFields(field.fields, data, originalDoc, path);
        } else if (field.type === 'array') {
          if (Array.isArray(data[field.name])) {
            data[field.name].forEach((rowData, i) => {
              const originalDocRow = originalDoc && originalDoc[field.name] && originalDoc[field.name][i];
              traverseFields(field.fields, rowData, originalDocRow || undefined, `${path}${field.name}.${i}.`);
            });
          }
        } else {
          traverseFields(field.fields, data[field.name], originalDoc[field.name], `${path}${field.name}.`);
        }
      }

      if (field.type === 'blocks') {
        if (Array.isArray(data[field.name])) {
          data[field.name].forEach((rowData, i) => {
            const block = field.blocks.find((blockType) => blockType.slug === rowData.blockType);
            const originalDocRow = originalDoc && originalDoc[field.name] && originalDoc[field.name][i];

            if (block) {
              traverseFields(block.fields, rowData, originalDocRow || undefined, `${path}${field.name}.${i}.`);
            }
          });
        }
      }

      if ((operation === 'create' || operation === 'update') && field.name) {
        const updatedData = data;

        if (data[field.name] === undefined && originalDoc[field.name] === undefined && field.defaultValue) {
          updatedData[field.name] = field.defaultValue;
        }

        if (field.type === 'array' || field.type === 'blocks') {
          const hasRowsOfNewData = Array.isArray(data[field.name]);
          const newRowCount = hasRowsOfNewData ? data[field.name].length : 0;

          // Handle cases of arrays being intentionally set to 0
          if (data[field.name] === '0' || data[field.name] === 0 || data[field.name] === null) {
            updatedData[field.name] = [];
          }

          const hasRowsOfExistingData = Array.isArray(originalDoc[field.name]);
          const existingRowCount = hasRowsOfExistingData ? originalDoc[field.name].length : 0;

          validationPromises.push(() => createValidationPromise({ [field.name]: newRowCount }, { [field.name]: existingRowCount }, field, path));
        } else {
          validationPromises.push(() => createValidationPromise(data, originalDoc, field, path, true));
        }
      }
    });
  };

  // //////////////////////////////////////////
  // Entry point for field validation
  // //////////////////////////////////////////

  traverseFields(entityConfig.fields, fullData, fullOriginalDoc, '');

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
