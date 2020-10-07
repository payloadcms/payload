const buildValidationPromise = async (fieldState, field) => {
  const validatedFieldState = fieldState;

  validatedFieldState.valid = typeof field.validate === 'function' ? await field.validate(fieldState.value, field) : true;

  if (typeof validatedFieldState.valid === 'string') {
    validatedFieldState.errorMessage = validatedFieldState.valid;
    validatedFieldState.valid = false;
  }
};

const buildStateFromSchema = async (fieldSchema, fullData) => {
  if (fieldSchema) {
    const validationPromises = [];

    const structureFieldState = (field, data = {}) => {
      const value = typeof data[field.name] !== 'undefined' ? data[field.name] : field.defaultValue;
      const fieldState = {
        value,
        initialValue: value,
      };

      validationPromises.push(buildValidationPromise(fieldState, field));

      return fieldState;
    };

    const iterateFields = (fields, data, path = '') => fields.reduce((state, field) => {
      let initialData = data;

      if (field.name && field.defaultValue && typeof initialData[field.name] === 'undefined') {
        initialData = { [field.name]: field.defaultValue };
      }

      if (field.name && typeof initialData[field.name] !== 'undefined') {
        if (field.type === 'relationship' && initialData[field.name] === null) {
          initialData[field.name] = 'null';
        }

        if (Array.isArray(initialData[field.name])) {
          if (field.type === 'array') {
            return {
              ...state,
              ...initialData[field.name].reduce((rowState, row, i) => ({
                ...rowState,
                ...iterateFields(field.fields, row, `${path}${field.name}.${i}.`),
              }), {}),
            };
          }

          if (field.type === 'blocks') {
            return {
              ...state,
              ...initialData[field.name].reduce((rowState, row, i) => {
                const block = field.blocks.find((blockType) => blockType.slug === row.blockType);
                const rowPath = `${path}${field.name}.${i}.`;

                return {
                  ...rowState,
                  [`${rowPath}blockType`]: {
                    value: row.blockType,
                    initialValue: row.blockType,
                    valid: true,
                  },
                  [`${rowPath}blockName`]: {
                    value: row.blockName,
                    initialValue: row.blockName,
                    valid: true,
                  },
                  ...(block?.fields ? iterateFields(block.fields, row, rowPath) : {}),
                };
              }, {}),
            };
          }
        }

        // Handle non-array-based nested fields (group, etc)
        if (field.fields) {
          return {
            ...state,
            ...iterateFields(field.fields, initialData[field.name], `${path}${field.name}.`),
          };
        }

        return {
          ...state,
          [`${path}${field.name}`]: structureFieldState(field, data),
        };
      }

      // Handle field types that do not use names (row, etc)
      if (field.fields) {
        return {
          ...state,
          ...iterateFields(field.fields, data, path),
        };
      }

      // Handle normal fields
      return {
        ...state,
        [`${path}${field.name}`]: structureFieldState(field, data),
      };
    }, {});

    const resultingState = iterateFields(fieldSchema, fullData);
    await Promise.all(validationPromises);
    return resultingState;
  }

  return {};
};


export default buildStateFromSchema;
