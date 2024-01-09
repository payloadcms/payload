import fs from 'fs'
const swc = require('@swc/core')
export async function transpileAndCopy(sourcePath, targetPath) {
  try {
    const inputCode = fs.readFileSync(sourcePath, 'utf-8')

    const { code } = await swc.transform(inputCode, {
      filename: sourcePath,
      jsc: {
        parser: {
          syntax: 'typescript',
        },
      },
    })

    fs.writeFileSync(targetPath.replace(/\.tsx?$/, '.js'), code, 'utf-8')
    console.log(`Transpiled and copied ${sourcePath} to ${targetPath.replace(/\.tsx?$/, '.js')}`)
  } catch (error) {
    console.error(`Error transpiling ${sourcePath}: ${error.message}`)
  }
}
