import { load } from './load.js'

const loadConfig = async (configPath: string) => {
  const configPromise = await load(configPath)
  return configPromise.default
}

describe('Loader', () => {
  it('should load using TS moduleResolution: bundler', async () => {
    const file = await load('./next-navigation-test.js')
    expect(typeof file.redirect).toStrictEqual('function')
  })

  it('should import complex configs', async () => {
    const config = await loadConfig('../fields/config.ts')
    expect(Array.isArray(config.collections)).toStrictEqual(true)
  })

  it('should import configs that rely on custom components', async () => {
    const config = await loadConfig('../admin/config.ts')
    expect(Array.isArray(config.collections)).toStrictEqual(true)
  })
})
