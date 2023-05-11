/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable no-param-reassign */

import type { UnionToIntersection, AnyArray } from 'ts-essentials';

type IsAny<Type> = 0 extends 1 & Type ? true : false;

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

type NonEmptyObject<T> = {} extends T ? never : T;

export type DeepPickQuery<Type> = IsAny<Type> extends true
  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  : Type extends AnyArray<unknown>
  ? DeepPickQuery<UnionToIntersection<Type[number]>>
  : {
      [Key in Exclude<keyof Type, symbol>]?: Type[Key] extends Primitive
        ? true
        : true | DeepPickQuery<Type[Key]>;
    };

export type DeepPick<T, K extends DeepPickQuery<T>> = T extends AnyArray<
  infer Item
>
  ? K extends DeepPickQuery<Item>
    ? AnyArray<DeepPick<Item, K>>
    : never
  : T extends unknown
  ? NonEmptyObject<{
      [P in Extract<keyof T, keyof K>]: K[P] extends true
        ? T[P]
        : K[P] extends DeepPickQuery<T[P]>
        ? DeepPick<T[P], K[P]>
        : never;
    }>
  : never;

export function deepPick<T, U extends DeepPickQuery<T>>(
  obj: T,
  query: U | true,
): DeepPick<T, U> {
  if (typeof obj !== 'object' || obj === null) return {} as DeepPick<T, U>;
  if (query === true) return obj as DeepPick<T, U>;

  if (Array.isArray(obj)) {
    return obj.map((item) => deepPick(item, query)) as DeepPick<T, U>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};
  Object.entries(query).forEach(([key, value]) => {
    if (value === true && obj[key]) {
      result[key] = obj[key];
    }
    const nestedResult = deepPick(obj[key], value);
    if (Object.keys(nestedResult).length > 0) {
      result[key] = nestedResult;
    }
  });

  return result;
}
