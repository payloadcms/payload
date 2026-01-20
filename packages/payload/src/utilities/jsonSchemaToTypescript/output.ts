export interface Config {
  [key: string]: unknown
}
/**
 * This type was referenced by `Config`'s JSON-Schema
 * via the `definition` "SupportedTimezones"
 */
export type SupportedTimezones = 'CST' | 'EST' | 'MST' | 'PST' | 'UTC'
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "TestInterface"
 */
export interface TestInterface {
  [key: string]: unknown
  age: number
  array?: string[]
  arrayWithObjects?: {
    [key: string]: unknown
    itemProp: number
  }[]
  constNumber?: 30
  constString?: 'hello'
  eitherStringOrNull?: null | string
  eitherStringOrNumber?: number | string
  enumMixed?: 'two' | 1 | true
  enumString?: 'option1' | 'option2' | 'option3'
  intersection?: {
    [key: string]: unknown
    a: string
  } & {
    [key: string]: unknown
    b: number
  }
  name: string
  object?: {
    [key: string]: unknown
    nestedProp: boolean
  }
  relation?: AnotherInterface
  union?:
    | {
        [key: string]: unknown
        foo: string
      }
    | AnotherInterface
    | boolean
    | number
    | string
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "AnotherInterface"
 */
export interface AnotherInterface {
  [key: string]: unknown
  isActive: boolean
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "WithoutAdditionalProperties"
 */
export interface WithoutAdditionalProperties {
  id?: string
}
