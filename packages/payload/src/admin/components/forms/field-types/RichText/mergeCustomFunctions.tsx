export default (enabledFunctions, builtInFunctions) => {
  const formattedEnabledFunctions = [...enabledFunctions]

  if (enabledFunctions.indexOf('ul') > -1 || enabledFunctions.indexOf('ol') > -1) {
    formattedEnabledFunctions.push('li')
  }

  return formattedEnabledFunctions.reduce((resultingFunctions, func) => {
    if (typeof func === 'object' && func.name) {
      return {
        ...resultingFunctions,
        [func.name]: func,
      }
    }

    if (typeof func === 'string' && builtInFunctions[func]) {
      return {
        ...resultingFunctions,
        [func]: builtInFunctions[func],
      }
    }

    return resultingFunctions
  }, {})
}
