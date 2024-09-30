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

  it('should import unexported, direct .js file from commonjs module', async () => {
    /*
    Background of this test: next/Link.js is a CJS module which directly resolves to the Link.js JavaScript file. This file is not part of the package.json main or exports fields.
    This test ensures that the loader can resolve this file even if the .js extension is omitted.

    Previously, this import would be resolved as an empty {} object rather than the full Link. Whether it's a named or default export doesn't matter.

    The reason for that is that this goes through the ts moduleResolution of our loader (the default node nextResolve fails, as the js extension specifier is missing).

    Now the ts moduleResolution is able to resolve the file correctly, however it resolves to the pnpm symlink of the file, which is not the actual file on disk. The CommonJS module loader
    seems to fail to resolve symlink file paths. We have added a function which resolves the original path for potential symlinks - this fixes the issue. This test ensures that.
     */
    const code = await startChildProcess('./fileWithCJSImport.ts')
    expect(code).toStrictEqual(0)
  })
})
