import fs from 'fs'
import path from 'path'

// Function to get all migration files (TS or JS) excluding 'index'
const getMigrationFiles = (dir: string) => {
  return fs
    .readdirSync(dir)
    .filter(
      (file) =>
        (file.endsWith('.ts') || file.endsWith('.js')) &&
        file !== 'index.ts' &&
        file !== 'index.js',
    )
    .sort()
}

// Function to generate the index.ts content
const generateIndexContent = (files: string[]) => {
  let imports = ''
  let exportsArray = 'export const migrations = [\n'

  files.forEach((file, index) => {
    const fileNameWithoutExt = file.replace(/\.[^/.]+$/, '')
    imports += `import * as migration_${fileNameWithoutExt} from './${fileNameWithoutExt}.js';\n`
    exportsArray += `  {
    up: migration_${fileNameWithoutExt}.up,
    down: migration_${fileNameWithoutExt}.down,
    name: '${fileNameWithoutExt}'${index !== files.length - 1 ? ',' : ''}\n  },\n`
  })

  exportsArray += '];\n'
  return imports + '\n' + exportsArray
}

// Main function to create the index.ts file
export const writeMigrationIndex = (args: { migrationsDir: string }) => {
  const migrationFiles = getMigrationFiles(args.migrationsDir)
  const indexContent = generateIndexContent(migrationFiles)

  fs.writeFileSync(path.join(args.migrationsDir, 'index.ts'), indexContent)
}
