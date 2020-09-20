import customComponents from '../../../customComponents';

const setComponent = async (obj, key, loadComponent) => {
  const newObj = obj;
  const Component = await loadComponent();
  newObj[key] = Component.default;
};

const loadComponents = (promises, obj) => Object.entries(obj).forEach(([key, val]) => {
  if (typeof val === 'object') {
    loadComponents(promises, val);
  }
  if (typeof val === 'function') {
    promises.push(setComponent(obj, key, val));
  }
});

export default async (path, enabledFunctions, builtInFunctions) => {
  const promises = [];

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

  loadComponents(promises, CustomFunctions);

  await Promise.all(promises);

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
