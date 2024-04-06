import { load } from './load.js'

const loadConfig = async (configPath) => {
  const configPromise = await load(configPath)
  return configPromise.default
}

async function load2() {
  const config = await loadConfig('../fields/config.ts')
  expect(Array.isArray(config.collections)).toStrictEqual(true)
}

void load2()
