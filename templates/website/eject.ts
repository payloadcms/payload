import fs from 'fs'
import path from 'path'

// Run this script to eject the front-end from this template
// This will remove all template-specific files and directories
// See `yarn eject` in `package.json` for the exact command
// See `./README.md#eject` for more information

const files = ['./next.config.js', './next-env.d.ts', './redirects.js']
const directories = ['./src/app']

const eject = async (): Promise<void> => {
  files.forEach(file => {
    fs.unlinkSync(path.join(__dirname, file))
  })

  directories.forEach(directory => {
    fs.rm(path.join(__dirname, directory), { recursive: true }, err => {
      if (err) throw err
    })
  })

  // create a new `./src/server.ts` file
  // use contents from `./src/server.default.ts`
  const serverFile = path.join(__dirname, './src/server.ts')
  const serverDefaultFile = path.join(__dirname, './src/server.default.ts')
  fs.copyFileSync(serverDefaultFile, serverFile)

  // remove `'plugin:@next/next/recommended', ` from `./.eslintrc.js`
  const eslintConfigFile = path.join(__dirname, './.eslintrc.js')
  const eslintConfig = fs.readFileSync(eslintConfigFile, 'utf8')
  const updatedEslintConfig = eslintConfig.replace(`'plugin:@next/next/recommended', `, '')
  fs.writeFileSync(eslintConfigFile, updatedEslintConfig, 'utf8')
}

eject()
