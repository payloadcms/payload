/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable no-param-reassign */

type AllKeysOfType<T> = {
  [P in keyof T]: T[P] extends never ? never : P;
}[keyof T];

type RemoveNever<T> = Pick<T, AllKeysOfType<T>>;

type Primitive =
  | string
  | number
  | boolean
  | String
  | Number
  | Boolean
  | Date
  | null
  | undefined;

export type DeepPickKeys<Type> = Type extends Array<unknown>
  ? {
      [Key in keyof Type]: DeepPickKeys<Type[Key]>;
    }[number]
  : {
      [Key in keyof Type]: Key extends string
        ? Type[Key] extends Primitive
          ? `${Key}`
          : `${Key}` | `${Key}.${DeepPickKeys<Type[Key]>}`
        : never;
    }[keyof Type];

export type DeepPick<Type, Query extends DeepPickKeys<Type>> = RemoveNever<{
  [Key in keyof Type]: Type extends Array<unknown>
    ? Query extends DeepPickKeys<Type[Key]>
      ? RemoveNever<DeepPick<Type[Key], Query>>
      : never
    : Key extends Query
    ? Type[Key]
    : Key extends string
    ? Query extends `${Key}.${infer SubQuery}`
      ? SubQuery extends DeepPickKeys<Type[Key]>
        ? RemoveNever<DeepPick<Type[Key], SubQuery>>
        : never
      : never
    : never;
}>;

export function deepPick<T, U extends DeepPickKeys<T>>(
  obj: T,
  paths: Array<U>,
): DeepPick<T, (typeof paths)[number]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};
  paths.forEach((path) => {
    // not sure why this is necessary, but it is
    const pathParts = (path as string).split('.');
    deepPickTo(obj, pathParts, result);
  });
  return result;
}

function deepPickTo<T>(obj: T, path: Array<string>, result: unknown): boolean {
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
