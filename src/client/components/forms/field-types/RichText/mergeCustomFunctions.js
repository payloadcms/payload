import customComponents from '../../../customComponents';

export default (path, enabledFunctions, builtInFunctions) => {
  const CustomFunctions = path.split('.').reduce((res, prop) => {
    const potentialRowIndex = parseInt(prop, 10);

    if (!Number.isNaN(potentialRowIndex) && res.fields) {
      return res.fields;
    }

    if (res && res[prop]) {
      return res[prop];
    }

    return {};
  }, customComponents);

  const formattedEnabledFunctions = [...enabledFunctions];

  if (enabledFunctions.indexOf('ul') > -1 || enabledFunctions.indexOf('ol') > -1) {
    formattedEnabledFunctions.push('li');
  }

  const enabledBuiltInFunctions = Object.entries(builtInFunctions).reduce((enabledBuiltIns, [name, components]) => {
    if (formattedEnabledFunctions.indexOf(name) > -1) {
      return {
        ...enabledBuiltIns,
        [name]: components,
      };
    }

    return enabledBuiltIns;
  }, {});

  const resultingFunctions = {
    ...enabledBuiltInFunctions,
    ...CustomFunctions,
  };

  return resultingFunctions;
};
