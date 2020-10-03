export default (enabledFunctions, builtInFunctions) => {
  const formattedEnabledFunctions = [...enabledFunctions];

  if (enabledFunctions.indexOf('ul') > -1 || enabledFunctions.indexOf('ol') > -1) {
    formattedEnabledFunctions.push('li');
  }

  return formattedEnabledFunctions.reduce((resultingFunctions, func) => {
    if (typeof func === 'object') {
      let customFunction = func;

      if (customFunction?.default?.name) {
        customFunction = customFunction.default;
      }

      return {
        ...resultingFunctions,
        [customFunction.name]: customFunction,
      };
    }

    if (typeof func === 'string' && builtInFunctions[func]) {
      return {
        ...resultingFunctions,
        [func]: builtInFunctions[func],
      };
    }

    return resultingFunctions;
  }, {});
};
