const buildValidationPromise = async (fieldState, field) => {
  const validatedFieldState = fieldState;

  validatedFieldState.valid = typeof field.validate === 'function' ? await field.validate(fieldState.value, field) : true;

  if (typeof validatedFieldState.valid === 'string') {
    validatedFieldState.errorMessage = validatedFieldState.valid;
    validatedFieldState.valid = false;
  }
};

const buildStateFromSchema = async (fieldSchema, fullData) => {
  if (fieldSchema && fullData) {
    const validationPromises = [];

    const structureFieldState = (field, data = {}) => {
      const value = data[field.name] || field.defaultValue;

      const fieldState = {
        value,
        initialValue: value,
      };

      validationPromises.push(buildValidationPromise(fieldState, field));

      return fieldState;
    };

    const iterateFields = (fields, data, path = '') => fields.reduce((state, field) => {
      if (field.name && data[field.name]) {
        if (Array.isArray(data[field.name])) {
          if (field.type === 'array') {
            return {
              ...state,
              ...data[field.name].reduce((rowState, row, i) => ({
                ...rowState,
                ...iterateFields(field.fields, row, `${path}${field.name}.${i}.`),
              }), {}),
            };
          }

          if (field.type === 'blocks') {
            return {
              ...state,
              ...data[field.name].reduce((rowState, row, i) => {
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
                  ...iterateFields(block.fields, row, rowPath),
                };
              }, {}),
            };
          }
        }

        if (field.fields) {
          return {
            ...state,
            ...iterateFields(field.fields, data[field.name], `${path}${field.name}.`),
          };
        }


        return {
          ...state,
          [`${path}${field.name}`]: structureFieldState(field, data),
        };
      }

      if (field.fields) {
        return {
          ...state,
          ...iterateFields(field.fields, data, path),
        };
      }

      return state;
    }, {});

    const resultingState = iterateFields(fieldSchema, fullData);
    await Promise.all(validationPromises);
    return resultingState;
  }

  return {};
};


export default buildStateFromSchema;
