import { initDevAndTest } from './initDevAndTest.js'

export async function runInit(
  testSuiteArg: string,
  writeDBAdapter: boolean,
  skipGenImportMap: boolean = false,
): Promise<void> {
  await initDevAndTest(testSuiteArg, String(writeDBAdapter), String(skipGenImportMap))
}
