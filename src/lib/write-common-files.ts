import path from 'path'
import fse from 'fs-extra'
import handlebars from 'handlebars'
import type { StaticTemplate } from '../types'

export async function writeCommonFiles(
  projectDir: string,
  template: StaticTemplate,
  packageManager: string,
): Promise<void> {
  const commonFilesDir = path.resolve(__dirname, 'common-files')

  // .npmrc
  const npmrc = path.resolve(commonFilesDir, 'npmrc.template')
  const npmrcDest = path.resolve(projectDir, '.npmrc')
  await fse.copy(npmrc, npmrcDest)

  // .gitignore
  const gi = path.resolve(commonFilesDir, 'gitignore.template')
  const giDest = path.resolve(projectDir, '.gitignore')
  await fse.copy(gi, giDest)

  // package.json
  const packageJsonTemplate = await fse.readFile(
    path.resolve(commonFilesDir, template.language, 'package.template.json'),
    'utf8',
  )
  const packageJson = handlebars.compile(packageJsonTemplate)({
    templateName: template.name,
  })
  await fse.writeFile(path.resolve(projectDir, 'package.json'), packageJson)

  // nodemon.json
  const nodemon = path.resolve(commonFilesDir, template.language, 'nodemon.json')
  const nodemonDest = path.resolve(projectDir, 'nodemon.json')
  await fse.copy(nodemon, nodemonDest)

  // README.md
  const readmeTemplate = await fse.readFile(
    path.resolve(commonFilesDir, 'README.template.md'),
    'utf8',
  )
  const readme = handlebars.compile(readmeTemplate)({
    projectName: path.basename(projectDir),
    templateName: template.name,
  })
  await fse.writeFile(path.resolve(projectDir, 'README.md'), readme)

  // tsconfig.json
  if (template.language === 'typescript') {
    const tsconfig = path.resolve(commonFilesDir, template.language, 'tsconfig.json')
    const tsconfigDest = path.resolve(projectDir, 'tsconfig.json')
    await fse.copy(tsconfig, tsconfigDest)
  }

  // docker-compose.yml
  const dockerComposeTemplate = await fse.readFile(
    path.resolve(commonFilesDir, 'docker-compose.template.yml'),
    'utf8',
  )
  const dockerCompose = handlebars.compile(dockerComposeTemplate)(
    packageManager === 'yarn'
      ? { installCmd: 'yarn install', devCmd: 'yarn dev' }
      : { installCmd: 'npm install', devCmd: 'npm run dev' },
  )
  await fse.writeFile(path.resolve(projectDir, 'docker-compose.yml'), dockerCompose)

  // Dockerfile
  const dockerfileTemplate = await fse.readFile(
    path.resolve(commonFilesDir, 'Dockerfile.template'),
    'utf8',
  )
  const dockerfile = handlebars.compile(dockerfileTemplate)(
    packageManager === 'yarn'
      ? { installCmd: 'yarn install', buildCmd: 'yarn build' }
      : { installCmd: 'npm install', buildCmd: 'npm run build' },
  )
  await fse.writeFile(path.resolve(projectDir, 'Dockerfile'), dockerfile)
}
