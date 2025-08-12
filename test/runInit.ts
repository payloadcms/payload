import { initDevAndTest } from './initDevAndTest.js'

export async function runInit(
  testSuiteArg: string,
  writeDBAdapter: boolean,
  skipGenImportMap: boolean = false,
  configFile?: string,
): Promise<void> {
  await initDevAndTest(testSuiteArg, String(writeDBAdapter), String(skipGenImportMap), configFile)
}
