import type { Payload, SanitizedConfig } from 'payload'

export type SeedFunction = (payload: Payload) => Promise<void> | void

export type TestDataConfig = {
  seed?: SeedFunction
  suite: string
}

export const testDataConfigSymbol: unique symbol = Symbol('testDataConfig')

type ConfigWithTestData = {
  [testDataConfigSymbol]?: TestDataConfig
} & SanitizedConfig

export const getTestDataConfig = (config: SanitizedConfig): TestDataConfig | undefined => {
  return (config as ConfigWithTestData)[testDataConfigSymbol]
}
