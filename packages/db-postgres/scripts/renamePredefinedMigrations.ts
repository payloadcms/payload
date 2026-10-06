import fs from 'fs'
import path from 'path'

/**
 * Adds an .mjs copy of each built .js file for ESM imports of predefined migrations. The .js file
 * is kept, since `exports/migration-utils` imports helpers from this folder (e.g.
 * `migrateLocalizeStatus.js`) by their .js name.
 */
const rename = () => {
  fs.readdirSync(path.resolve('./dist/predefinedMigrations'))
    .filter((f) => {
      return f.endsWith('.js')
    })
    .forEach((file) => {
      const newPath = path.join('./dist/predefinedMigrations', file)
      fs.copyFileSync(newPath, newPath.replace('.js', '.mjs'))
    })
  console.log('done')
}

rename()
