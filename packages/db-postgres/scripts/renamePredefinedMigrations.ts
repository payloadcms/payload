import fs from 'fs'
import path from 'path'

/**
 * Changes built .js files to .mjs to for ESM imports
 */
const rename = () => {
  fs.readdirSync(path.resolve('./dist/predefinedMigrations'))
    .filter((f) => {
      return f.endsWith('.js')
    })
    .forEach((file) => {
      const newPath = path.join('./dist/predefinedMigrations', file)
      fs.renameSync(newPath, newPath.replace('.js', '.mjs'))
    })
  console.log('done')
}

rename()
