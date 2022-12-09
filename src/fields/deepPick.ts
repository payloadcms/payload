/* eslint-disable no-param-reassign */

type AllKeysOfType<T> = {
  [P in keyof T]: T[P] extends never ? never : P
}[keyof T]

type RemoveNever<T> = Pick<T, AllKeysOfType<T>>

export type DeepPick<Type, Query> = RemoveNever<{
  [P in keyof Type]: Type extends Array<any>
    ? RemoveNever<DeepPick<Type[P], Query>>
    : P extends Query
    ? Type[P]
    : P extends string
    ? Query extends `${P}.${infer SubQuery}`
      ? RemoveNever<DeepPick<Type[P], SubQuery>>
      : never
    : never
}>

export function deepPick<T, U extends string>(
  obj: T,
  paths: Array<U>,
): DeepPick<T, typeof paths[number]> {
  const result: any = {};
  paths.forEach((path) => {
    const pathParts = path.split('.');
    deepPickTo(obj, pathParts, result);
  });
  return result;
}

function deepPickTo<T>(obj: T, path: Array<string>, result: any): boolean {
  if (typeof result !== 'object' || typeof obj !== 'object') {
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
    const newArray = value.map((subObj, idx) => {
      const subResult = result[pathPart]?.[idx] ?? {};
      if (deepPickTo(subObj, path.slice(1), subResult)) {
        someFound = true;
        return subResult;
      }
      return result[pathPart]?.[idx] ?? {};
    });

    if (someFound) {
      result[pathPart] = newArray;
      return true;
    }
    return false;
  }
  const subResult = result[pathPart] ?? {};
  if (deepPickTo(value, path.slice(1), subResult)) {
    result[pathPart] = subResult;
    return true;
  }
  return false;
}
