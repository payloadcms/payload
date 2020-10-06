const { isValidObjectId } = require('mongoose');

const hookPromise = async ({
  data,
  field,
  hook,
  performFieldOperations,
  req,
  operation,
  fullOriginalDoc,
  fullData,
  payload,
}) => {
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
              const relatedCollection = payload.collections[relation].config;

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
                  dataToHook = await performFieldOperations(relatedCollection, {
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
          const relatedCollection = payload.collections[relation].config;
          let relatedDocumentData = data[field.name];
          let dataToHook = resultingData[field.name];

          if (hasManyRelations) {
            relatedDocumentData = data[field.name].value;
            dataToHook = resultingData[field.name].value;
          }

          // Only run hooks for populated sub documents - NOT IDs
          if (relatedDocumentData && !isValidObjectId(relatedDocumentData)) {
            // Perform field hooks on related collection
            dataToHook = await performFieldOperations(relatedCollection, {
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

module.exports = hookPromise;
