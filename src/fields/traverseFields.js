const validationPromise = require('./validationPromise');
const accessPromise = require('./accessPromise');
const hookPromise = require('./hookPromise');

const traverseFields = (args) => {
  const {
    fields,
    data = {},
    originalDoc = {},
    path,
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
    performFieldOperations,
    validationPromises,
    errors,
    payload,
    populate,
  } = args;

  fields.forEach((field) => {
    const dataCopy = data;

    if (reduceLocales && field.name && field.localized && locale !== 'all' && typeof data[field.name] === 'object') {
      let localizedValue = data[field.name][locale];
      if (typeof localizedValue === 'undefined' && fallbackLocale) localizedValue = data[field.name][fallbackLocale];
      if (typeof localizedValue === 'undefined') localizedValue = null;
      dataCopy[field.name] = localizedValue;
    }

    if (operation === 'read' && field.hidden && typeof data[field.name] !== 'undefined') {
      delete data[field.name];
    }

    if (field.type === 'upload') {
      if (data[field.name] === '') dataCopy[field.name] = null;
    }

    if (field.type === 'checkbox') {
      if (data[field.name] === 'true') dataCopy[field.name] = true;
      if (data[field.name] === 'false') dataCopy[field.name] = false;
      if (data[field.name] === '') dataCopy[field.name] = false;
    }

    // If richText content comes through as a string, parse it into JSON

    if (field.type === 'richText' && typeof data[field.name] === 'string') {
      dataCopy[field.name] = JSON.parse(data[field.name]);
    }

    accessPromises.push(accessPromise({
      populate,
      data,
      originalDoc,
      field,
      operation,
      overrideAccess,
      req,
      id,
      relationshipPopulations,
      hook,
    }));

    hookPromises.push(hookPromise({
      data,
      field,
      hook,
      performFieldOperations,
      req,
      operation,
      fullOriginalDoc,
      fullData,
      payload,
    }));

    if (field.fields) {
      if (field.name === undefined) {
        traverseFields({
          ...args,
          fields: field.fields,
        });
      } else if (field.type === 'array') {
        if (Array.isArray(data[field.name])) {
          data[field.name].forEach((rowData, i) => {
            const originalDocRow = originalDoc && originalDoc[field.name] && originalDoc[field.name][i];
            traverseFields({
              ...args,
              fields: field.fields,
              data: rowData,
              originalDoc: originalDocRow || undefined,
              path: `${path}${field.name}.${i}.`,
            });
          });
        }
      } else {
        traverseFields({
          ...args,
          fields: field.fields,
          data: data[field.name],
          originalDoc: originalDoc[field.name],
          path: `${path}${field.name}.`,
        });
      }
    }

    if (field.type === 'blocks') {
      if (Array.isArray(data[field.name])) {
        data[field.name].forEach((rowData, i) => {
          const block = field.blocks.find((blockType) => blockType.slug === rowData.blockType);
          const originalDocRow = originalDoc && originalDoc[field.name] && originalDoc[field.name][i];

          if (block) {
            traverseFields({
              ...args,
              fields: block.fields,
              data: rowData,
              originalDoc: originalDocRow || undefined,
              path: `${path}${field.name}.${i}.`,
            });
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

        validationPromises.push(() => validationPromise({
          errors,
          hook,
          newData: { [field.name]: newRowCount },
          existingData: { [field.name]: existingRowCount },
          field,
          path,
        }));
      } else {
        validationPromises.push(() => validationPromise({
          errors,
          hook,
          newData: data,
          existingData: originalDoc,
          field,
          path,
        }));
      }
    }
  });
};

module.exports = traverseFields;
