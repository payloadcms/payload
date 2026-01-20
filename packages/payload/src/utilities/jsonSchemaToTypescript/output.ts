#!
export interface Config {}
export interface TestInterface {
  age: number
  constNumber?: 30
  constString?: 'hello'
  name: string
  relation?: AnotherInterface
}
export interface AnotherInterface {
  isActive: boolean
}
