import fs from 'fs'
import path from 'path'

// Run this script to eject the front-end from this template
// This will remove all template-specific files and directories
// See `yarn eject` in `package.json` for the exact command
// See `./README.md#eject` for more information

const files = ['./next.config.js', './next-env.d.ts']
const directories = ['./src/pages', './src/public', './src/graphql', './src/css', './src/providers']

const eject = async (): Promise<void> => {
  files.forEach(file => {
    fs.unlinkSync(path.join(__dirname, file))
  })

  directories.forEach(directory => {
    fs.rm(path.join(__dirname, directory), { recursive: true }, err => {
      if (err) throw err
    })
  })

  // remove all components EXCEPT any Payload ones
  const payloadComponents = ['BeforeDashboard']
  const components = fs.readdirSync(path.join(__dirname, './src/components'))
  components.forEach(component => {
    if (!payloadComponents.includes(component)) {
      fs.rm(path.join(__dirname, `./src/components/${component}`), { recursive: true }, err => {
        if (err) throw err
      })
    }
  })

  // remove all blocks EXCEPT the associated Payload configs (`index.ts`)
  const blocks = fs.readdirSync(path.join(__dirname, './src/blocks'))
  blocks.forEach(block => {
    const blockFiles = fs.readdirSync(path.join(__dirname, `./src/blocks/${block}`))
    blockFiles.forEach(file => {
      if (file !== 'index.ts') {
        fs.rm(path.join(__dirname, `./src/blocks/${block}/${file}`), err => {
          if (err) throw err
        })
      }
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
