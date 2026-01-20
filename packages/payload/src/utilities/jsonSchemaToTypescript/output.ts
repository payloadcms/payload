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
  enumString?: string
  name: string
  object?: {
    nestedProp: boolean
  }
  relation?: AnotherInterface
}
export interface AnotherInterface {
  isActive: boolean
}
