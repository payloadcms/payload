#!
export interface Config {}
export interface TestInterface {
  age: number
  array?: string[]
  arrayWithObjects?: {
    itemProp: number
  }[]
  constNumber?: 30
  constString?: 'hello'
  enumMixed?: 'two' | 1 | true
  enumString?: 'option1' | 'option2' | 'option3'
  name: string
  object?: {
    nestedProp: boolean
  }
  relation?: AnotherInterface
  union?:
    | {
        foo: string
      }
    | AnotherInterface
    | boolean
    | number
    | string
}
export interface AnotherInterface {
  isActive: boolean
}
