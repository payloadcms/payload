import { startChildProcess } from './startChildProcess.js'

describe('Loader', () => {
  it('should load dependencies without extensions', async () => {
    const code = await startChildProcess('./dependency-test.js')
    expect(code).toStrictEqual(0)
  })

  it('should import complex configs', async () => {
    const code = await startChildProcess('../fields/config.ts')
    expect(code).toStrictEqual(0)
  })

  it('should import configs that rely on custom components', async () => {
    const code = await startChildProcess('../admin/config.ts')
    expect(code).toStrictEqual(0)
  })
})
