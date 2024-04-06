import { load } from './load.js'

describe('Config Loader', () => {
  it('should load using TS moduleResolution: bundler', async () => {
    const file = await load('./next-navigation-test.js')
    expect(typeof file.redirect).toStrictEqual('function')
  })
})
