export const replaceDoubleCurlys = (str, variables): string => {
  const regex = /{{(.+?)}}/g;
  if (str && variables) {
    return str.replace(regex, (_, variable) => {
      const foundVariable = variables.find(({ field: fieldName }) => variable === fieldName);
      if (foundVariable) return foundVariable.value;
      return variable;
    })
  }
  return str;
}
