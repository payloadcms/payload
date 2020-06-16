exports.createValidationPromise = async (data, field) => {
  const result = await field.validate(data, field);
  return { result, field };
};

exports.getErrorResults = async (resultPromises, path) => {
  const results = await Promise.all(resultPromises);

  return results.reduce((formattedResults, result) => {
    const { field, result: validationResult } = result;

    if (Array.isArray(result)) {
      return [
        ...formattedResults,
        ...result,
      ];
    }

    if (validationResult === false || typeof validationResult === 'string') {
      return [
        ...formattedResults,
        {
          field: `${path}${field.name}`,
          message: validationResult,
        },
      ];
    }

    return formattedResults;
  }, []);
};
