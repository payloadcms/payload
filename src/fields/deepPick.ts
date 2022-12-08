/* eslint-disable no-param-reassign */

// this is a placeholder for a complex type
type DeepPick<TObject, TPaths extends string> = Partial<TObject>;


export function deepPick<T>(
  obj: T,
  paths: Array<string>,
): DeepPick<T, typeof paths[number]> {
  const result: any = {};
  paths.forEach((path) => {
    const pathParts = path.split('.');
    deepPickTo(obj, pathParts, result);
  });
  return result;
}

function deepPickTo<T>(obj: T, path: Array<string>, result: any): boolean {
  if (typeof result !== 'object') {
    return false;
  }
  const pathPart = path[0];
  if (!(pathPart in obj)) {
    return false;
  }
  const value = obj[pathPart];
  if (path.length === 1) {
    result[pathPart] = obj[pathPart];
    return true;
  }
  if (Array.isArray(value)) {
    let someFound = false;
    const newArray = value.map((subObj) => {
      const subResult = result[pathPart] || {};
      if (deepPickTo(subObj, path.slice(1), subResult)) {
        someFound = true;
        return subResult;
      }
      return {};
    });

    if (someFound) {
      result[pathPart] = newArray;
      return true;
    }
    return false;
  }
  const subResult = result[pathPart] || {};
  if (deepPickTo(value, path.slice(1), subResult)) {
    result[pathPart] = subResult;
    return true;
  }
  return false;
}
