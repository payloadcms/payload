#!
export interface Config {
  [key: string]: unknown
}
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
export interface AnotherInterface {
  [key: string]: unknown
  isActive: boolean
}
export interface WithoutAdditionalProperties {
  id?: string
}
