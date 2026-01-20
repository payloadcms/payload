/**
 * Config interface
 */
export interface Config {
  [key: string]: unknown
}
/**
 * TestInterface interface
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
  enumString?: string
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
 * AnotherInterface interface
 */
export interface AnotherInterface {
  [key: string]: unknown
  isActive: boolean
}
/**
 * WithoutAdditionalProperties interface
 */
export interface WithoutAdditionalProperties {
  id?: string
}
